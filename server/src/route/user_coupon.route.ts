import express from 'express'
import { claimCoupon, getUserCoupons } from '../controller/user_coupon.controller'

const router = express.Router()

router.post('/claim', claimCoupon)
router.get('/my', getUserCoupons)

export default router
