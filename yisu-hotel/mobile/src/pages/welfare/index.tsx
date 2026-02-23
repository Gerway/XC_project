import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { hotelApi } from '../../api/hotel';
import './index.scss';

interface Coupon {
    coupon_id: string;
    title: string;
    discount_amount: string; // from decimal in DB
    min_spend: string;
    start_time: string;
    end_time: string;
    total_count: number;
    issued_count: number;
}

const WelfarePage: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [myCouponIds, setMyCouponIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { statusBarHeight } = Taro.getSystemInfoSync();

    const fetchCouponsAndStatus = async () => {
        try {
            const userInfoStr = Taro.getStorageSync('userInfo');
            let userId: string | undefined = undefined;
            if (userInfoStr) {
                let userInfo;
                try {
                    userInfo = typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr;
                } catch {
                    userInfo = userInfoStr;
                }
                userId = userInfo?.user_id;
            }

            const [allCouponsRes, myCouponsRes] = await Promise.all([
                hotelApi.getCouponsList(),
                userId ? hotelApi.getUserCoupons({ user_id: userId }) : Promise.resolve([])
            ]);

            // Filter out expired coupons (where end_time < now)
            const now = new Date().getTime();
            const validCoupons = (allCouponsRes as unknown as Coupon[]).filter(c => {
                if (!c.end_time) return true;
                return new Date(c.end_time).getTime() > now;
            });

            setCoupons(validCoupons);

            // Extract IDs of coupons the user has already claimed
            const claimedIds = (myCouponsRes as any[]).map(uc => uc.coupon_id);
            setMyCouponIds(claimedIds);

        } catch (err) {
            console.error('获取优惠券或用户状态失败', err);
            Taro.showToast({ title: '部分数据加载失败', icon: 'none' });
        } finally {
            setLoading(false);
        }
    };

    useDidShow(() => {
        fetchCouponsAndStatus();
    });

    const handleClaim = async (coupon_id: string, total: number, issued: number, isClaimed: boolean) => {
        if (isClaimed) {
            // Go to home page to use it
            Taro.switchTab({ url: '/pages/home/index' });
            return;
        }

        if (total !== -1 && issued >= total) {
            Taro.showToast({ title: '该优惠券已抢光啦', icon: 'none' });
            return;
        }

        const userInfoStr = Taro.getStorageSync('userInfo');
        if (!userInfoStr) {
            Taro.showToast({ title: '请先登录', icon: 'none' });
            setTimeout(() => {
                Taro.navigateTo({ url: '/pages/login/index' });
            }, 1000);
            return;
        }

        let userInfo;
        try {
            userInfo = typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr;
        } catch {
            userInfo = userInfoStr;
        }

        try {
            Taro.showLoading({ title: '领取中...' });
            await hotelApi.claimCoupon({ coupon_id, user_id: userInfo.user_id });
            Taro.hideLoading();
            Taro.showToast({ title: '领取成功！', icon: 'success' });
            // Refresh list to update issued count and my claim status
            fetchCouponsAndStatus();
        } catch (err: any) {
            Taro.hideLoading();
            const msg = err?.data?.message || err?.response?.data?.message || err?.message || '领取失败';
            Taro.showToast({ title: msg, icon: 'none' });
        }
    };

    return (
        <View className="welfare-page">
            {/* Header / Hero Area */}
            <View className="welfare-page__header">
                <View style={{ height: `${statusBarHeight}px` }} />
                <View className="welfare-page__header-inner">
                    <Text className="welfare-page__title">福利中心</Text>
                </View>

                <View className="welfare-page__hero">
                    <View className="welfare-page__hero-content">
                        <Text className="welfare-page__hero-title">天天来领券</Text>
                        <Text className="welfare-page__hero-sub">便宜看得见 · 惊喜不间断</Text>
                    </View>
                    <View className="welfare-page__hero-decor">
                        {/* Box icon placeholder (emoji used as fallback) */}
                        <Text className="welfare-page__hero-icon">🎁</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className="welfare-page__scroll">
                <View className="welfare-page__section-header">
                    <Text className="welfare-page__section-title">天天抢神券</Text>
                    <Text className="welfare-page__section-desc">领券订房更优惠</Text>
                </View>

                {loading ? (
                    <View className="welfare-page__loading">
                        <Text>加载中...</Text>
                    </View>
                ) : (
                    <View className="welfare-page__list">
                        {coupons.map(coupon => {
                            const isSoldOut = coupon.total_count !== -1 && coupon.issued_count >= coupon.total_count;
                            const isClaimed = myCouponIds.includes(coupon.coupon_id);
                            const amount = parseInt(coupon.discount_amount);
                            const minSpend = parseInt(coupon.min_spend);

                            // Visual states
                            const showAsDisabled = isSoldOut;
                            const btnText = isClaimed ? '去使用' : (isSoldOut ? '已抢光' : '立即抢');
                            // Secondary button style for "Go Use"
                            const btnClass = isClaimed
                                ? 'welfare-page__btn welfare-page__btn--secondary'
                                : (showAsDisabled ? 'welfare-page__btn welfare-page__btn--disabled' : 'welfare-page__btn');

                            return (
                                <View
                                    key={coupon.coupon_id}
                                    className={`welfare-page__card ${showAsDisabled ? 'welfare-page__card--sold-out' : ''}`}
                                >
                                    <View className="welfare-page__card-left">
                                        <View className="welfare-page__card-price">
                                            <Text className="welfare-page__card-symbol">¥</Text>
                                            <Text className="welfare-page__card-amount">{amount}</Text>
                                        </View>
                                        <Text className="welfare-page__card-condition">
                                            满{minSpend}可用
                                        </Text>
                                    </View>

                                    <View className="welfare-page__card-divider">
                                        <View className="welfare-page__card-notch-top" />
                                        <View className="welfare-page__card-dash" />
                                        <View className="welfare-page__card-notch-bottom" />
                                    </View>

                                    <View className="welfare-page__card-right">
                                        <Text className="welfare-page__card-name">{coupon.title}</Text>

                                        <View
                                            className={btnClass}
                                            onClick={() => handleClaim(coupon.coupon_id, coupon.total_count, coupon.issued_count, isClaimed)}
                                        >
                                            <Text>{btnText}</Text>
                                        </View>
                                    </View>

                                    {/* Watermark for Sold Out (only if not claimed) */}
                                    {isSoldOut && !isClaimed && (
                                        <View className="welfare-page__watermark">
                                            <Text>已抢光</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {!loading && coupons.length === 0 && (
                    <View className="welfare-page__empty">
                        <Text>暂无可用福利</Text>
                    </View>
                )}

                <View style={{ height: '40px' }} />
            </ScrollView>
        </View>
    );
};

export default WelfarePage;
