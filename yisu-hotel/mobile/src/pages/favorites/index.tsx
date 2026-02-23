import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { hotelApi } from '../../api/hotel';
import './index.scss';

interface FavHotel {
    hotel_id: string;
    hotel_name: string;
    hotel_address: string;
    score: number;
    reviews_count: number;
    tags: string;
    min_price: number;
    image_url: string;
    created_at?: string;
    viewed_at?: string;
}

const Favorites: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState('');
    const [favHotels, setFavHotels] = useState<FavHotel[]>([]);
    const [historyHotels, setHistoryHotels] = useState<FavHotel[]>([]);
    const [loading, setLoading] = useState(false);

    useDidShow(() => {
        const userInfoStr = Taro.getStorageSync('userInfo');
        const loggedIn = !!userInfoStr;
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
            try {
                const uid = JSON.parse(userInfoStr).user_id;
                setUserId(uid);
                fetchData(uid);
            } catch { }
        }
    });

    const fetchData = async (uid: string) => {
        setLoading(true);
        try {
            const [favRes, histRes] = await Promise.all([
                hotelApi.getFavorites({ user_id: uid }),
                hotelApi.getViewHistory({ user_id: uid })
            ]);
            if (favRes?.data) setFavHotels(favRes.data);
            if (histRes?.data) setHistoryHotels(histRes.data);
        } catch (e) {
            console.error('fetchData error', e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        Taro.navigateTo({ url: '/pages/login/index' });
    };

    const parseTags = (tags: string): string[] => {
        try {
            return JSON.parse(tags);
        } catch {
            return [];
        }
    };

    const renderHotelCard = (hotel: FavHotel) => (
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
                        {hotel.hotel_name}
                    </Text>
                    <View className="favorites-page__card-score-row">
                        <Text className="favorites-page__card-score">{hotel.score}分</Text>
                        <Text className="favorites-page__card-reviews">{hotel.reviews_count}人评价</Text>
                    </View>
                    <Text className="favorites-page__card-location">
                        {hotel.hotel_address} · {parseTags(hotel.tags)[0] || ''}
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

    // 将历史按日期分组
    const groupHistoryByDate = (list: FavHotel[]) => {
        const groups: Record<string, FavHotel[]> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        list.forEach(h => {
            const viewedDate = new Date((h.viewed_at || '').replace(/-/g, '/'));
            viewedDate.setHours(0, 0, 0, 0);

            let label: string;
            if (viewedDate.getTime() === today.getTime()) {
                label = '今天';
            } else if (viewedDate.getTime() === yesterday.getTime()) {
                label = '昨天';
            } else {
                const m = (viewedDate.getMonth() + 1).toString().padStart(2, '0');
                const d = viewedDate.getDate().toString().padStart(2, '0');
                label = `${m}-${d}`;
            }

            if (!groups[label]) groups[label] = [];
            groups[label].push(h);
        });

        return groups;
    };

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
                ) : loading ? (
                    <View className="favorites-page__empty">
                        <Text className="favorites-page__empty-text">加载中...</Text>
                    </View>
                ) : activeTab === 'favorites' ? (
                    <View className="favorites-page__list">
                        {favHotels.length === 0 ? (
                            <View className="favorites-page__empty">
                                <Text className="favorites-page__empty-icon">💔</Text>
                                <Text className="favorites-page__empty-text">暂无收藏的酒店</Text>
                            </View>
                        ) : (
                            <>
                                {favHotels.map(hotel => renderHotelCard(hotel))}
                                <View className="favorites-page__end-text"><Text>没有更多了</Text></View>
                            </>
                        )}
                    </View>
                ) : (
                    <View className="favorites-page__group-list">
                        {historyHotels.length === 0 ? (
                            <View className="favorites-page__empty">
                                <Text className="favorites-page__empty-icon">👀</Text>
                                <Text className="favorites-page__empty-text">暂无浏览记录</Text>
                            </View>
                        ) : (
                            <>
                                {Object.entries(groupHistoryByDate(historyHotels)).map(([dateLabel, hotels]) => (
                                    <View key={dateLabel}>
                                        <Text className="favorites-page__group-title">{dateLabel}</Text>
                                        <View className="favorites-page__list">
                                            {hotels.map(hotel => renderHotelCard(hotel))}
                                        </View>
                                    </View>
                                ))}
                                <View className="favorites-page__end-text"><Text>没有更多了</Text></View>
                            </>
                        )}
                    </View>
                )}
                {/* Safe area spacer */}
                <View style={{ height: '20px' }}></View>
            </ScrollView>
        </View>
    );
};

export default Favorites;
