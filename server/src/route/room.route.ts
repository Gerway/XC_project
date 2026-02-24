import express from 'express';
import {
    getMerchantRoomList,
    batchUpdateRoomInventory,
    createRoom,
    deleteRoom,
    addRoomInventory,
    deleteRoomInventory
} from '../controller/room.controller';

const router = express.Router();

// 获取当前登录商户名下指定酒店的房型列表(及指定日期库存总数)
router.get('/merchant-list', getMerchantRoomList);

// 批量设置商户名下指定房型的某几天或某月中特定星期的库存和价格
router.put('/inventory/batch-update', batchUpdateRoomInventory);

// 新增房型
router.post('/create', createRoom);

// 删除房型及对应库存
router.delete('/delete', deleteRoom);

// 批量新增库存
router.post('/inventory/add', addRoomInventory);

// 批量删除库存
router.post('/inventory/delete', deleteRoomInventory);

export default router;
