import express from 'express'
import { getCouponsList, createCoupon, deleteCoupon } from '../controller/coupon.controller'

const router = express.Router()

router.get('/', getCouponsList)
router.post('/', createCoupon)
router.delete('/:id', deleteCoupon)

export default router
