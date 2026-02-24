import express from 'express';
import { getMerchantOrderList, updateOrderAdmin } from '../controller/order.controller';

const router = express.Router();

// 后台/商户：获取订单列表 (带有分页以及多条件检索)
// 参数在 query 中： 例如 ?user_id=xxx&page=1&pageSize=10
router.get('/merchant-list', getMerchantOrderList);

// 后台/商户：手工介入更改订单状态、入住时间和退房时间
// 改为 PUT 请求，只能修改特定的几个字段
router.put('/admin-update', updateOrderAdmin);

export default router;
