import React, { useState } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { COUPONS } from '../../constants';
import './index.scss';

const CouponsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Unused' | 'Used' | 'Expired'>('Unused');
    const { statusBarHeight } = Taro.getSystemInfoSync();

    // Mock data filtering (Using all mock coupons as Unused for demo, or filter if status existed)
    const displayCoupons = COUPONS.filter(c => !c.is_used);

    return (
        <View className="coupons-page">
            <View className="coupons-page__header">
                <View style={{ height: `${statusBarHeight}px` }}></View>
                <View className="coupons-page__header-inner">
                    <View className="coupons-page__header-left">
                        <View onClick={() => Taro.navigateBack()} className="coupons-page__back-btn">
                            <Text className="coupons-page__back-icon">‹</Text>
                        </View>
                        <Text className="coupons-page__title">Coupons & Rewards</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className="coupons-page__main">
                {/* Coupon Center Hero */}
                {/* <View className="coupons-page__hero">
                    <View className="coupons-page__hero-inner">
                        <Text className="coupons-page__hero-badge">Summer Special</Text>
                        <Text className="coupons-page__hero-title">20% OFF</Text>
                        <Text className="coupons-page__hero-subtitle">On your next stay over $200</Text>
                        <View className="coupons-page__hero-collect-btn" onClick={() => Taro.showToast({ title: 'Collected!', icon: 'success' })}>
                            <Text>Collect</Text>
                        </View>
                    </View>
                    <View className="coupons-page__hero-decor"></View>
                </View> */}

                {/* My Coupons */}
                <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Text className="coupons-page__section-title">My Coupons</Text>

                    <View className="coupons-page__tabs">
                        {['Unused', 'Used', 'Expired'].map(tab => (
                            <View
                                key={tab}
                                className={`coupons-page__tab-btn ${activeTab === tab ? 'coupons-page__tab-btn--active' : ''}`}
                                onClick={() => setActiveTab(tab as any)}
                            >
                                <Text>{tab}</Text>
                            </View>
                        ))}
                    </View>

                    {displayCoupons.map(coupon => (
                        <View key={coupon.coupon_id} className="coupons-page__coupon-card">
                            <View className="coupons-page__coupon-value">
                                <Text className="coupons-page__coupon-amount">${coupon.discount_amount}</Text>
                                <Text className="coupons-page__coupon-off">OFF</Text>
                            </View>
                            <View className="coupons-page__coupon-info">
                                <View>
                                    <Text className="coupons-page__coupon-title">{coupon.title}</Text>
                                    <Text className="coupons-page__coupon-min-spend">Min spend ${coupon.min_spend}</Text>
                                </View>
                                <View className="coupons-page__coupon-bottom">
                                    <Text className="coupons-page__coupon-expiry">Exp: {coupon.end_time}</Text>
                                    <View onClick={() => Taro.switchTab({ url: '/pages/home/index' })} className="coupons-page__coupon-use-btn">
                                        <Text>Use Now</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}

                    {displayCoupons.length === 0 && (
                        <View className="coupons-page__empty">
                            <Text>No coupons found</Text>
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
