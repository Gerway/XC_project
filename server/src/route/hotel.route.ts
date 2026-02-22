import express from "express";
import { searchHotels, getHotelDetails, getRoomInventory, createOrder, payOrder } from "../controller/hotel.controller";

const router = express.Router();

// 搜索酒店列表（用户端）
router.post("/search", searchHotels);
router.post("/details", getHotelDetails);
router.post("/room-inventory", getRoomInventory);
router.post("/order/create", createOrder);
router.post("/order/pay", payOrder);

export default router;
