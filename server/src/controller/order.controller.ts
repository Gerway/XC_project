import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

/**
 * 获取订单列表的查询参数接口
 */
interface GetOrderListQuery {
    page?: string;      // 页码，默认1
    pageSize?: string;  // 每页条数，默认10
    user_id?: string;   // 商户的 user_id (必须提供)
    hotel_id?: string;  // 商户名下特定的酒店ID（可选，不传查全部）
    status?: string;    // 订单状态: 0未支付 1已支付 2已入住 3已完成 4已取消 (可选)
    order_id?: string;  // 根据订单号进行模糊查询 (可选)
}

/**
 * 获取商户订单列表 (分页、条件查询)
 * 将返回包含酒店名、房型名、入住/退房日期、以及订单详细明细等数据的对象。
 */
export const getMerchantOrderList = async (
    req: Request<{}, {}, {}, GetOrderListQuery>,
    res: Response
): Promise<void> => {
    try {
        const {
            page = '1',
            pageSize = '10',
            user_id,
            hotel_id,
            status,
            order_id
        } = req.query;

        if (!user_id) {
            res.status(400).json({ message: '缺少商户 user_id 参数' });
            return;
        }

        const pageNum = parseInt(page, 10) || 1;
        const sizeNum = parseInt(pageSize, 10) || 10;
        const offset = (pageNum - 1) * sizeNum;

        let baseSql = `
            FROM orders o
            JOIN hotel h ON o.hotel_id = h.hotel_id
            LEFT JOIN room r ON o.room_id = r.room_id
            WHERE h.user_id = ?
        `;
        const params: any[] = [user_id];

        if (hotel_id) {
            baseSql += ` AND o.hotel_id = ?`;
            params.push(hotel_id);
        }
        if (status !== undefined && status !== '') {
            baseSql += ` AND o.status = ?`;
            params.push(parseInt(status, 10));
        }
        if (order_id) {
            baseSql += ` AND o.order_id LIKE ?`;
            params.push(`%${order_id}%`);
        }

        // Count total
        const countSql = `SELECT COUNT(o.order_id) as total ${baseSql}`;
        const [countResult] = await pool.execute<RowDataPacket[]>(countSql, params);
        const total = countResult[0].total as number;

        // Fetch paginated order records
        const dataSql = `
            SELECT 
                o.*,
                DATE_FORMAT(o.check_in, '%Y-%m-%d %H:%i:%s') as check_in_str,
                DATE_FORMAT(o.check_out, '%Y-%m-%d %H:%i:%s') as check_out_str,
                h.name as hotel_name,
                r.name as room_name
            ${baseSql}
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const dataParams = [...params, sizeNum.toString(), offset.toString()]; // limit/offset as strings or passing numbers using cast 

        // Use prepared statements with proper limit/offset needs trick in mysql2 if not enabled cast, but usually passing strings works or we cast it nicely.
        // Actually mysql2 can throw if LIMIT ? is passed a JS string when expecting a number in strict mode. 
        // We will just interpolate LIMIT ${sizeNum} OFFSET ${offset} directly since they are parsed integers, safe from SQL injection.
        const safeDataSql = `
            SELECT 
                o.*,
                DATE_FORMAT(o.check_in, '%Y-%m-%d %H:%i:%s') as check_in_str,
                DATE_FORMAT(o.check_out, '%Y-%m-%d %H:%i:%s') as check_out_str,
                h.name as hotel_name,
                r.name as room_name
            ${baseSql}
            ORDER BY o.created_at DESC
            LIMIT ${sizeNum} OFFSET ${offset}
        `;

        const [orders] = await pool.execute<RowDataPacket[]>(safeDataSql, params);

        if (orders.length === 0) {
            res.status(200).json({
                message: '查询成功',
                data: {
                    total: 0,
                    page: pageNum,
                    pageSize: sizeNum,
                    list: []
                }
            });
            return;
        }

        const orderIds = orders.map(o => o.order_id);
        const placeholders = orderIds.map(() => '?').join(',');

        // Fetch associated order details
        const detailsSql = `
            SELECT 
                order_details_id, order_id, 
                DATE_FORMAT(order_details_date, '%Y-%m-%d') as date, 
                price, breakfast_count
            FROM order_details
            WHERE order_id IN (${placeholders})
            ORDER BY order_details_date ASC
        `;
        const [details] = await pool.execute<RowDataPacket[]>(detailsSql, orderIds);

        // Group details by order_id
        const detailsByOrderId: Record<string, any[]> = {};
        for (const d of details) {
            if (!detailsByOrderId[d.order_id]) {
                detailsByOrderId[d.order_id] = [];
            }
            detailsByOrderId[d.order_id].push(d);
        }

        // Attach details to orders
        const list = orders.map(o => ({
            ...o,
            check_in: o.check_in_str || o.check_in,
            check_out: o.check_out_str || o.check_out,
            details: detailsByOrderId[o.order_id] || []
        }));

        res.status(200).json({
            message: '查询成功',
            data: {
                total,
                page: pageNum,
                pageSize: sizeNum,
                list
            }
        });
    } catch (err) {
        console.error('getMerchantOrderList error:', err);
        res.status(500).json({ message: '获取订单列表失败', error: String(err) });
    }
};

/**
 * 更改订单状态及信息的请求体接口
 * 按照需求，目前只允许管理员手工介入修改: 状态、入住时间、退房时间
 */
interface UpdateOrderAdminBody {
    order_id: string;   // 需要修改的订单ID
    status?: number;    // 订单状态: 0未支付 1已支付 2已入住 3已完成 4已取消
    check_in?: string;  // 入住时间 (格式: YYYY-MM-DD HH:mm:ss)
    check_out?: string; // 退房时间 (格式: YYYY-MM-DD HH:mm:ss)
}

/**
 * 管理员/商户手工介入更改订单状态和入住退房时间的接口
 */
export const updateOrderAdmin = async (
    req: Request<{}, {}, UpdateOrderAdminBody>,
    res: Response
): Promise<void> => {
    try {
        const { order_id, status, check_in, check_out } = req.body;

        if (!order_id) {
            res.status(400).json({ message: '缺少 order_id' });
            return;
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }
        if (check_in !== undefined) {
            updates.push('check_in = ?');
            params.push(check_in);
        }
        if (check_out !== undefined) {
            updates.push('check_out = ?');
            params.push(check_out);
        }

        if (updates.length === 0) {
            res.status(400).json({ message: '没有提供需要更新的字段' });
            return;
        }

        const sql = `UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`;
        params.push(order_id);

        await pool.execute(sql, params);

        res.status(200).json({ message: '订单更新成功' });
    } catch (err) {
        console.error('updateOrderAdmin error:', err);
        res.status(500).json({ message: '订单更新失败', error: String(err) });
    }
};
