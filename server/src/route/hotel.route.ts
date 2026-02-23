import express from "express";
import { searchHotels, getHotelDetails, getRoomInventory, createOrder, payOrder, updatePendingOrder, getUserOrders, deleteOrder, cancelOrder, getOrderDetail } from "../controller/hotel.controller";

const router = express.Router();

// 搜索酒店列表（用户端）
router.post("/search", searchHotels);
router.post("/details", getHotelDetails);
router.post("/room-inventory", getRoomInventory);
router.post("/order/create", createOrder);
router.post("/order/pay", payOrder);
router.post("/order/update", updatePendingOrder);
router.post("/order/list", getUserOrders);
router.post("/order/delete", deleteOrder);
router.post("/order/cancel", cancelOrder);
router.post("/order/detail", getOrderDetail);

export default router;
