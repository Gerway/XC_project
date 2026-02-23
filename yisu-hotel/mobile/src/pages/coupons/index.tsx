import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { hotelApi } from '../../api/hotel';
import './index.scss';

// Matching backend returned unified shape
interface UserCoupon {
    user_coupons_id: string; // the issued instance
    status: number; // 0: unused, 1: used
    coupon_id: string;
    title: string;
    discount_amount: string; // from decimal
    min_spend: string; // from decimal
    start_time: string;
    end_time: string;
}

type TabType = 'unused' | 'used' | 'expired';

const CouponsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('unused');
    const [coupons, setCoupons] = useState<UserCoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const { statusBarHeight } = Taro.getSystemInfoSync();

    const fetchMyCoupons = async () => {
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
        const userId = userInfo?.user_id;

        try {
            setLoading(true);
            const res = await hotelApi.getUserCoupons({ user_id: userId });
            setCoupons(res as unknown as UserCoupon[]);
        } catch (err) {
            console.error('获取我的优惠券失败', err);
            Taro.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            setLoading(false);
        }
    };

    useDidShow(() => {
        fetchMyCoupons();
    });

    const now = new Date().getTime();

    // Derived State Computations
    const unusedCoupons = coupons.filter(c =>
        c.status === 0 && (!c.end_time || new Date(c.end_time).getTime() > now)
    );

    // Status can be 1 (used manually/systemically later)
    const usedCoupons = coupons.filter(c => c.status === 1);

    // Status 0 but expired
    const expiredCoupons = coupons.filter(c =>
        c.status === 0 && c.end_time && new Date(c.end_time).getTime() <= now
    );

    let displayCoupons: UserCoupon[] = [];
    if (activeTab === 'unused') displayCoupons = unusedCoupons;
    if (activeTab === 'used') displayCoupons = usedCoupons;
    if (activeTab === 'expired') displayCoupons = expiredCoupons;

    const getBtnText = (tab: TabType) => {
        if (tab === 'unused') return '去使用';
        if (tab === 'used') return '已使用';
        return '已过期';
    };

    const handleUseCoupon = (tab: TabType) => {
        if (tab === 'unused') {
            Taro.switchTab({ url: '/pages/home/index' });
        }
    };

    return (
        <View className="coupons-page">
            <View className="coupons-page__header">
                <View style={{ height: `${statusBarHeight}px` }}></View>
                <View className="coupons-page__header-inner">
                    <View className="coupons-page__header-left">
                        <View onClick={() => Taro.navigateBack()} className="coupons-page__back-btn">
                            <Text className="coupons-page__back-icon">‹</Text>
                        </View>
                        <Text className="coupons-page__title">我的优惠券</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className="coupons-page__main">
                <View style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>

                    <View className="coupons-page__tabs">
                        <View
                            className={`coupons-page__tab-btn ${activeTab === 'unused' ? 'coupons-page__tab-btn--active' : ''}`}
                            onClick={() => setActiveTab('unused')}
                        >
                            <Text>未使用 ({unusedCoupons.length})</Text>
                        </View>
                        <View
                            className={`coupons-page__tab-btn ${activeTab === 'used' ? 'coupons-page__tab-btn--active' : ''}`}
                            onClick={() => setActiveTab('used')}
                        >
                            <Text>已使用 ({usedCoupons.length})</Text>
                        </View>
                        <View
                            className={`coupons-page__tab-btn ${activeTab === 'expired' ? 'coupons-page__tab-btn--active' : ''}`}
                            onClick={() => setActiveTab('expired')}
                        >
                            <Text>已过期 ({expiredCoupons.length})</Text>
                        </View>
                    </View>

                    {loading ? (
                        <View className="coupons-page__empty">
                            <Text>加载中...</Text>
                        </View>
                    ) : (
                        displayCoupons.map(coupon => {
                            const amount = parseInt(coupon.discount_amount) || 0;
                            const isVoid = activeTab === 'used' || activeTab === 'expired';

                            return (
                                <View key={coupon.user_coupons_id} className={`coupons-page__coupon-card ${isVoid ? 'coupons-page__coupon-card--disabled' : ''}`}>
                                    <View className="coupons-page__coupon-value">
                                        <View style={{ display: 'flex', alignItems: 'baseline' }}>
                                            <Text className="coupons-page__coupon-symbol">¥</Text>
                                            <Text className="coupons-page__coupon-amount">{amount}</Text>
                                        </View>
                                        <Text className="coupons-page__coupon-off">满{parseInt(coupon.min_spend)}可用</Text>
                                    </View>

                                    <View className="coupons-page__coupon-info">
                                        <View>
                                            <Text className="coupons-page__coupon-title">{coupon.title}</Text>
                                        </View>
                                        <View className="coupons-page__coupon-bottom">
                                            {coupon.end_time ? (
                                                <Text className="coupons-page__coupon-expiry">有效期至 {new Date(coupon.end_time).toLocaleDateString()}</Text>
                                            ) : (
                                                <Text className="coupons-page__coupon-expiry">长期有效</Text>
                                            )}

                                            <View
                                                onClick={() => handleUseCoupon(activeTab)}
                                                className={`coupons-page__coupon-use-btn ${isVoid ? 'coupons-page__coupon-use-btn--disabled' : ''}`}
                                            >
                                                <Text>{getBtnText(activeTab)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}

                    {!loading && displayCoupons.length === 0 && (
                        <View className="coupons-page__empty">
                            <Text>暂无该状态的优惠券</Text>
                        </View>
                    )}
                </View>

                {/* Safe area spacer */}
                <View style={{ height: '40px' }}></View>
            </ScrollView>
        </View>
    );
};

export default CouponsPage;
