import express from "express";
import { searchHotels, getHotelDetails } from "../controller/hotel.controller";

const router = express.Router();

// 搜索酒店列表（用户端）
router.post("/search", searchHotels);
router.post("/details", getHotelDetails);

export default router;
