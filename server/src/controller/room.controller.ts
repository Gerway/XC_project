import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

interface GetMerchantRoomListQuery {
    user_id?: string;
    hotel_id?: string;
    start_date?: string; // YYYY-MM-DD
    end_date?: string;   // YYYY-MM-DD
}

/**
 * 1. 获取商户名下指定酒店的房型列表，并统计在指定时间段内的"总库存数量"
 * 如果 start_date 和 end_date 被提供，将返回 `total_stock`（这段时间的库存加总）。
 */
export const getMerchantRoomList = async (
    req: Request<{}, {}, {}, GetMerchantRoomListQuery>,
    res: Response
): Promise<void> => {
    try {
        const { user_id, hotel_id, start_date, end_date } = req.query;

        // 参数校验
        if (!user_id || !hotel_id) {
            res.status(400).json({ code: -1, message: '缺少 user_id 或 hotel_id' });
            return;
        }

        // 验证该 hotel 是否属于该 user_id
        const [hotelRows] = await pool.execute<RowDataPacket[]>(
            'SELECT hotel_id FROM hotel WHERE hotel_id = ? AND user_id = ?',
            [hotel_id, user_id]
        );
        if (hotelRows.length === 0) {
            res.status(403).json({ code: -1, message: '暂无权限或未找到该酒店' });
            return;
        }

        let sql = `SELECT r.* FROM room r WHERE r.hotel_id = ?`;
        let params: any[] = [hotel_id];

        // 获取该酒店的所有房型
        const [rooms] = await pool.execute<RowDataPacket[]>(sql, params);

        if (rooms.length === 0) {
            res.status(200).json({ code: 200, message: '查询成功', data: [] });
            return;
        }

        // 始终返回总库存数量
        const roomIds = rooms.map(r => r.room_id);
        const placeholders = roomIds.map(() => '?').join(',');

        let stockSql = `
            SELECT room_id, SUM(stock) as total_stock
            FROM room_inventory
            WHERE room_id IN (${placeholders})
        `;
        const stockParams: any[] = [...roomIds];

        if (start_date && end_date) {
            stockSql += ` AND date >= ? AND date <= ?`;
            stockParams.push(start_date, end_date);
        }

        stockSql += ` GROUP BY room_id`;

        const [stockRows] = await pool.execute<RowDataPacket[]>(stockSql, stockParams);

        const stockMap: Record<string, number> = {};
        stockRows.forEach(row => {
            stockMap[row.room_id] = Number(row.total_stock) || 0;
        });

        // 将总库存数量挂载到返回值中
        const resultList = rooms.map(r => ({
            ...r,
            total_stock: stockMap[r.room_id] || 0
        }));

        res.status(200).json({ code: 200, message: '查询成功', data: resultList });

    } catch (err) {
        console.error('getMerchantRoomList error:', err);
        res.status(500).json({ code: -1, message: '获取房型列表失败', error: String(err) });
    }
};

interface BatchUpdateInventoryBody {
    user_id: string;
    hotel_id: string;
    room_id: string;
    start_date: string; // 开始日期 YYYY-MM-DD
    end_date: string;   // 结束日期 YYYY-MM-DD
    weekdays?: number[]; // [0, 1, 2, ..., 6] 0表示周日，1表示周一，以此类推。不传则代表选中此区间所有天。
    price?: number;      // 批量修改的价格 
    stock?: number;      // 批量修改的库存
}

/**
 * 2. 批量设置 user_id 名下的 hotel_id 酒店的 room_id 房型，在段日期范围内的特定星期的库存和价格
 */
export const batchUpdateRoomInventory = async (
    req: Request<{}, {}, BatchUpdateInventoryBody>,
    res: Response
): Promise<void> => {
    try {
        const { user_id, hotel_id, room_id, start_date, end_date, weekdays, price, stock } = req.body;

        if (!user_id || !hotel_id || !room_id || !start_date || !end_date) {
            res.status(400).json({ code: -1, message: '缺少必填参数(user_id, hotel_id, room_id, start_date, end_date)' });
            return;
        }

        if (price === undefined && stock === undefined) {
            res.status(400).json({ code: -1, message: '库存(stock)和价格(price)至少需要提供一项进行修改' });
            return;
        }

        // 验证权限和房型归属
        const checkSql = `
            SELECT r.room_id 
            FROM room r
            JOIN hotel h ON r.hotel_id = h.hotel_id
            WHERE r.room_id = ? AND r.hotel_id = ? AND h.user_id = ?
        `;
        const [checkRows] = await pool.execute<RowDataPacket[]>(checkSql, [room_id, hotel_id, user_id]);

        if (checkRows.length === 0) {
            res.status(403).json({ code: -1, message: '无权限操作该房型或该房型不存在' });
            return;
        }

        // 收集需要更新的日期
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
            res.status(400).json({ code: -1, message: '日期格式不正确或开始日期晚于结束日期' });
            return;
        }

        const targetDates: string[] = [];
        let cursorDate = new Date(startDate);

        while (cursorDate <= endDate) {
            const currentDayOfWeek = cursorDate.getDay(); // 0(Sun) - 6(Sat)

            // 如果定义了特定星期，并且当前日期符合时，才被纳入更新名单
            if (!weekdays || weekdays.length === 0 || weekdays.includes(currentDayOfWeek)) {
                // 转回 YYYY-MM-DD 本地格式避免时区偏差
                const yyyy = cursorDate.getFullYear();
                const mm = String(cursorDate.getMonth() + 1).padStart(2, '0');
                const dd = String(cursorDate.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                targetDates.push(dateStr);
            }
            // 加一天
            cursorDate.setDate(cursorDate.getDate() + 1);
        }

        if (targetDates.length === 0) {
            res.status(200).json({ code: 200, message: '所选区间没有匹配的天数，未执行任何更新' });
            return;
        }

        // 从 DB 里先捞一把现有的 room_inventory 记录，判断哪些需要 Insert，哪些需要 Update。
        // （如果不采用 INSERT ... ON DUPLICATE KEY UPDATE 可以规避一些因为只传了price不传stock，而导致新建一条记录时stock缺失的非空约束报错。
        //   查询现有记录然后对比，逻辑更稳妥些）
        const placeholders = targetDates.map(() => '?').join(',');
        const existingSql = `
            SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, price, stock 
            FROM room_inventory 
            WHERE room_id = ? AND date IN (${placeholders})
        `;
        const existingParams = [room_id, ...targetDates];
        const [existingRows] = await pool.execute<RowDataPacket[]>(existingSql, existingParams);

        const existingMap: Record<string, { price: number, stock: number }> = {};
        existingRows.forEach(r => {
            existingMap[r.date] = { price: Number(r.price), stock: Number(r.stock) };
        });

        const missingDates = targetDates.filter(d => !existingMap[d]);
        if (missingDates.length > 0) {
            res.status(400).json({
                code: -1,
                message: `由于以下日期没有库存，批量修改失败，请先新增相关日期的库存：\n${missingDates.join(', ')}`
            });
            return;
        }

        const updateParams: any[] = [];

        for (const dateStr of targetDates) {
            const currentPrice = existingMap[dateStr].price;
            const currentStock = existingMap[dateStr].stock;

            const newPrice = price !== undefined ? price : currentPrice;
            const newStock = stock !== undefined ? stock : currentStock;

            // Update row parameter format: [newPrice, newStock, room_id, dateStr]
            updateParams.push([newPrice, newStock, room_id, dateStr]);
        }

        // Execute batch updates within a transaction
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const params of updateParams) {
                await connection.execute(`
                    UPDATE room_inventory 
                    SET price = ?, stock = ? 
                    WHERE room_id = ? AND date = ?
                `, params);
            }

            await connection.commit();
        } catch (updateErr) {
            await connection.rollback();
            throw updateErr;
        } finally {
            connection.release();
        }

        res.status(200).json({
            code: 200,
            message: `成功批量更新了 ${targetDates.length} 天的库存及价格`,
            data: { updated_dates_count: targetDates.length }
        });
    } catch (err) {
        console.error('batchUpdateRoomInventory error:', err);
        res.status(500).json({ code: -1, message: '批量更新库存失败', error: String(err) });
    }
};

/**
 * 3. 增加房型接口
 */
export const createRoom = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            hotel_id, name, room_type, has_breakfast, max_occupancy,
            area, ori_price, floor, has_window, add_bed, has_wifi,
            remark, room_bed, user_id
        } = req.body;

        if (!hotel_id || !name || !user_id) {
            res.status(400).json({ code: -1, message: '缺少必填参数(hotel_id, name, user_id)' });
            return;
        }

        // 验证 hotel_id 是否属于当前商户 user_id
        const [hotelRows] = await pool.execute<RowDataPacket[]>(
            'SELECT hotel_id FROM hotel WHERE hotel_id = ? AND user_id = ?',
            [hotel_id, user_id]
        );
        if (hotelRows.length === 0) {
            res.status(403).json({ code: -1, message: '暂无权限或未找到该酒店' });
            return;
        }

        const room_id = `RM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const insertSql = `
            INSERT INTO room (room_id, hotel_id, name, room_type, has_breakfast, max_occupancy, area, ori_price, floor, has_window, add_bed, has_wifi, remark, room_bed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let floorJson = floor;
        if (typeof floor !== 'string') {
            floorJson = JSON.stringify(floor || []);
        }

        const params = [
            room_id, hotel_id, name,
            room_type || 1, has_breakfast ? 1 : 0, max_occupancy || 2,
            area || 20, ori_price || 0, floorJson, has_window ? 1 : 0,
            add_bed ? 1 : 0, has_wifi ? 1 : 0, remark || '', room_bed || ''
        ];

        await pool.execute(insertSql, params);

        res.status(200).json({ code: 200, message: '房型添加成功', data: { room_id } });
    } catch (err) {
        console.error('createRoom error:', err);
        res.status(500).json({ code: -1, message: '增加房型失败', error: String(err) });
    }
};

/**
 * 4. 删除房型接口 (同时删除对应库存数据)
 */
export const deleteRoom = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { room_id, hotel_id, user_id } = req.body;

        if (!room_id || !hotel_id || !user_id) {
            res.status(400).json({ code: -1, message: '缺少必填参数(room_id, hotel_id, user_id)' });
            return;
        }

        // 验证权限
        const checkSql = `
            SELECT r.room_id 
            FROM room r
            JOIN hotel h ON r.hotel_id = h.hotel_id
            WHERE r.room_id = ? AND r.hotel_id = ? AND h.user_id = ?
        `;
        const [checkRows] = await pool.execute<RowDataPacket[]>(checkSql, [room_id, hotel_id, user_id]);

        if (checkRows.length === 0) {
            res.status(403).json({ code: -1, message: '无权限操作该房型或房型不存在' });
            return;
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 删除房型对应库存
            await connection.execute(`DELETE FROM room_inventory WHERE room_id = ?`, [room_id]);
            // 删除房型本身
            await connection.execute(`DELETE FROM room WHERE room_id = ?`, [room_id]);

            await connection.commit();
            res.status(200).json({ code: 200, message: '房型及关联库存删除成功' });
        } catch (delErr) {
            await connection.rollback();
            throw delErr;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('deleteRoom error:', err);
        res.status(500).json({ code: -1, message: '删除房型失败', error: String(err) });
    }
};

interface AddInventoryBody {
    user_id: string;
    hotel_id: string;
    room_id: string;
    start_date: string;
    end_date: string;
    weekdays?: number[];
    price: number;
    stock: number;
}

/**
 * 5. 增加房型库存接口 (仅允许为还没设置库存的日期新建)
 */
export const addRoomInventory = async (
    req: Request<{}, {}, AddInventoryBody>,
    res: Response
): Promise<void> => {
    try {
        const { user_id, hotel_id, room_id, start_date, end_date, weekdays, price, stock } = req.body;

        if (!user_id || !hotel_id || !room_id || !start_date || !end_date || price === undefined || stock === undefined) {
            res.status(400).json({ code: -1, message: '缺少必填参数(必须提供价格和库存)' });
            return;
        }

        // 验证权限和房型归属
        const checkSql = `
            SELECT r.room_id 
            FROM room r
            JOIN hotel h ON r.hotel_id = h.hotel_id
            WHERE r.room_id = ? AND r.hotel_id = ? AND h.user_id = ?
        `;
        const [checkRows] = await pool.execute<RowDataPacket[]>(checkSql, [room_id, hotel_id, user_id]);

        if (checkRows.length === 0) {
            res.status(403).json({ code: -1, message: '无权限操作该房型或房型不存在' });
            return;
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
            res.status(400).json({ code: -1, message: '日期格式不正确或开始日期晚于结束日期' });
            return;
        }

        const targetDates: string[] = [];
        let cursorDate = new Date(startDate);
        while (cursorDate <= endDate) {
            const currentDayOfWeek = cursorDate.getDay();
            if (!weekdays || weekdays.length === 0 || weekdays.includes(currentDayOfWeek)) {
                const yyyy = cursorDate.getFullYear();
                const mm = String(cursorDate.getMonth() + 1).padStart(2, '0');
                const dd = String(cursorDate.getDate()).padStart(2, '0');
                targetDates.push(`${yyyy}-${mm}-${dd}`);
            }
            cursorDate.setDate(cursorDate.getDate() + 1);
        }

        if (targetDates.length === 0) {
            res.status(200).json({ code: 200, message: '没有匹配任何日期需要新增' });
            return;
        }

        // Insert using IGNORE or throw error if dates already have inventory
        const placeholders = targetDates.map(() => '?').join(',');
        const [existingRows] = await pool.execute<RowDataPacket[]>(
            `SELECT DATE_FORMAT(date, '%Y-%m-%d') as date FROM room_inventory WHERE room_id = ? AND date IN (${placeholders})`,
            [room_id, ...targetDates]
        );

        if (existingRows.length > 0) {
            const existingDatesSet = new Set(existingRows.map(r => r.date));
            const conflictDates = targetDates.filter(d => existingDatesSet.has(d));
            res.status(400).json({ code: -1, message: `以下日期已经存在库存，不能重复添加，请走修改接口：\n${conflictDates.join(', ')}` });
            return;
        }

        const insertValues = targetDates.map((dateStr, index) => {
            const inventory_id = `INV_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`;
            return [inventory_id, room_id, dateStr, price, stock];
        });
        const insertPlaceholders = insertValues.map(() => '(?, ?, ?, ?, ?)').join(',');
        const flatValues = insertValues.flat();

        const insertSql = `INSERT INTO room_inventory (inventory_id, room_id, date, price, stock) VALUES ${insertPlaceholders}`;
        await pool.execute(insertSql, flatValues);

        res.status(200).json({ code: 200, message: `成功为 ${targetDates.length} 天新增库存` });
    } catch (err) {
        console.error('addRoomInventory error:', err);
        res.status(500).json({ code: -1, message: '新增库存失败', error: String(err) });
    }
};

/**
 * 6. 删除特定日期房型库存
 */
export const deleteRoomInventory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { user_id, hotel_id, room_id, start_date, end_date, weekdays } = req.body;

        if (!user_id || !hotel_id || !room_id || !start_date || !end_date) {
            res.status(400).json({ code: -1, message: '缺少必填参数' });
            return;
        }

        // 验证权限
        const checkSql = `
            SELECT r.room_id 
            FROM room r
            JOIN hotel h ON r.hotel_id = h.hotel_id
            WHERE r.room_id = ? AND r.hotel_id = ? AND h.user_id = ?
        `;
        const [checkRows] = await pool.execute<RowDataPacket[]>(checkSql, [room_id, hotel_id, user_id]);

        if (checkRows.length === 0) {
            res.status(403).json({ code: -1, message: '暂无权限' });
            return;
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
            res.status(400).json({ code: -1, message: '日期非法' });
            return;
        }

        const targetDates: string[] = [];
        let cursorDate = new Date(startDate);
        while (cursorDate <= endDate) {
            const currentDayOfWeek = cursorDate.getDay();
            if (!weekdays || weekdays.length === 0 || weekdays.includes(currentDayOfWeek)) {
                const yyyy = cursorDate.getFullYear();
                const mm = String(cursorDate.getMonth() + 1).padStart(2, '0');
                const dd = String(cursorDate.getDate()).padStart(2, '0');
                targetDates.push(`${yyyy}-${mm}-${dd}`);
            }
            cursorDate.setDate(cursorDate.getDate() + 1);
        }

        if (targetDates.length === 0) {
            res.status(200).json({ code: 200, message: '没有匹配任何日期需要删除' });
            return;
        }

        const placeholders = targetDates.map(() => '?').join(',');
        const updateSql = `UPDATE room_inventory SET stock = 0 WHERE room_id = ? AND date IN (${placeholders})`;

        const [result] = await pool.execute<any>(updateSql, [room_id, ...targetDates]);

        res.status(200).json({ code: 200, message: `成功将 ${result.affectedRows} 天的库存设置为了 0` });
    } catch (err) {
        console.error('deleteRoomInventory error:', err);
        res.status(500).json({ code: -1, message: '清空指定日期库存失败', error: String(err) });
    }
};
