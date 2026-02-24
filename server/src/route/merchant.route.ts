import express from 'express'
import * as merchantCtl from '../controller/merchant_hotel.controller'

const router = express.Router()

// 1. 酒店资料管理
router.post('/list', merchantCtl.getMerchantHotels)
router.post('/save', merchantCtl.saveMerchantHotel)
router.post('/media', merchantCtl.manageHotelMedia)
router.post('/delete', merchantCtl.deleteMerchantHotel)

// 管理员审核
router.post('/audit/list', merchantCtl.getAuditList)
router.post('/audit/review', merchantCtl.auditHotel)

// 2. 房型资料管理
router.post('/room/list', merchantCtl.getRoomList)
router.post('/room/save', merchantCtl.saveRoom)
router.post('/room/delete', merchantCtl.deleteRoom)
router.post('/room/media', merchantCtl.manageRoomMedia)

// 3. 房态与库存
router.post('/inventory/list', merchantCtl.getInventory)
router.post('/inventory/batch-update', merchantCtl.batchUpdateInventory)

// 4. 订单管理
router.post('/order/list', merchantCtl.getMerchantOrders)
router.post('/order/update-status', merchantCtl.updateOrderStatus)

// 5. 评价管理
router.post('/review/list', merchantCtl.getMerchantReviews)

export default router
