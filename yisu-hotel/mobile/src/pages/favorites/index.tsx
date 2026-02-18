import React, { useState } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { HOTELS } from '../../constants';
import { Hotel } from '../../../types/types';
import './index.scss';

const Favorites: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useDidShow(() => {
        const userInfo = Taro.getStorageSync('userInfo');
        setIsLoggedIn(!!userInfo);
    });

    const favHotels = HOTELS.slice(0, 2);
    const historyData = {
        '今天': HOTELS.slice(1, 3),
        '昨天': HOTELS.slice(3, 4)
    };

    const handleLogin = () => {
        Taro.navigateTo({ url: '/pages/login/index' });
    };

    const renderHotelCard = (hotel: Hotel) => (
        <View
            key={hotel.hotel_id}
            className="favorites-page__hotel-card"
            onClick={() => Taro.navigateTo({ url: `/pages/hotel-details/index?id=${hotel.hotel_id}` })}
        >
            <View className="favorites-page__card-image">
                <Image src={hotel.image_url} className="favorites-page__card-img" mode="aspectFill" />
                <View className="favorites-page__card-type-tag">
                    <Text>酒店</Text>
                </View>
            </View>

            <View className="favorites-page__card-content">
                <View>
                    <Text className="favorites-page__card-name">
                        {hotel.name}
                    </Text>
                    <View className="favorites-page__card-score-row">
                        <Text className="favorites-page__card-score">{hotel.score}分</Text>
                        <Text className="favorites-page__card-reviews">{hotel.reviews_count}人评价</Text>
                    </View>
                    <Text className="favorites-page__card-location">
                        重庆 · 近{hotel.address.split(' ').slice(0, 2).join(' ')} · {hotel.tags[0]}
                    </Text>
                    <Text className="favorites-page__card-dates">
                        02-12至02-13入住
                    </Text>
                </View>

                <View className="favorites-page__card-price-row">
                    <Text className="favorites-page__card-currency">¥</Text>
                    <Text className="favorites-page__card-price">{hotel.min_price}</Text>
                    <Text className="favorites-page__card-price-suffix">起</Text>
                </View>
            </View>
        </View>
    );

    const { statusBarHeight } = Taro.getSystemInfoSync();

    return (
        <View className="favorites-page">
            <View className="favorites-page__header">
                <View style={{ height: `${statusBarHeight}px`, background: '#fff' }}></View>
                <View className="favorites-page__header-inner">
                    <View
                        onClick={() => Taro.navigateBack()}
                        className="favorites-page__back-btn"
                    >
                        <Text className="favorites-page__back-icon">‹</Text>
                    </View>

                    <Text className="favorites-page__title">收藏 / 足迹</Text>

                    <View className="favorites-page__header-actions">
                        <Text className="favorites-page__header-action-icon">🔍</Text>
                        <Text className="favorites-page__header-action-icon">⋮</Text>
                    </View>
                </View>

                <View className="favorites-page__tabs">
                    <View
                        onClick={() => setActiveTab('favorites')}
                        className={`favorites-page__tab ${activeTab === 'favorites' ? 'favorites-page__tab--active' : ''}`}
                    >
                        <Text>收藏</Text>
                        {activeTab === 'favorites' && (
                            <View className="favorites-page__tab-indicator"></View>
                        )}
                    </View>
                    <View
                        onClick={() => setActiveTab('history')}
                        className={`favorites-page__tab ${activeTab === 'history' ? 'favorites-page__tab--active' : ''}`}
                    >
                        <Text>足迹</Text>
                        {activeTab === 'history' && (
                            <View className="favorites-page__tab-indicator"></View>
                        )}
                    </View>
                </View>
            </View>

            <ScrollView scrollY className="favorites-page__main">
                {!isLoggedIn ? (
                    <View className="favorites-page__empty">
                        <Text className="favorites-page__empty-icon">🔒</Text>
                        <Text className="favorites-page__empty-text">登录后查看收藏和足迹</Text>
                        <View className="favorites-page__login-btn" onClick={handleLogin}>
                            <Text>立即登录</Text>
                        </View>
                    </View>
                ) : activeTab === 'favorites' ? (
                    <View className="favorites-page__list">
                        {favHotels.map(hotel => renderHotelCard(hotel))}
                        <View className="favorites-page__end-text"><Text>没有更多了</Text></View>
                    </View>
                ) : (
                    <View className="favorites-page__group-list">
                        {Object.entries(historyData).map(([dateLabel, hotels]) => (
                            <View key={dateLabel}>
                                <Text className="favorites-page__group-title">{dateLabel}</Text>
                                <View className="favorites-page__list">
                                    {hotels.map(hotel => renderHotelCard(hotel))}
                                </View>
                            </View>
                        ))}
                        <View className="favorites-page__end-text"><Text>没有更多了</Text></View>
                    </View>
                )}
                {/* Safe area spacer */}
                <View style={{ height: '20px' }}></View>
            </ScrollView>
        </View>
    );
};

export default Favorites;
