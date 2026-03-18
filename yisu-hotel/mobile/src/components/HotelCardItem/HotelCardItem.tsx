import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';

const BADGE_CLASS_MAP: Record<string, string> = {
    'Economy': '',
    'Comfort': 'search-page__hotel-badge--purple',
    'Upscale': 'search-page__hotel-badge--blue',
    'Luxury': 'search-page__hotel-badge--orange',
};

const HOTEL_TYPE_MAP: Record<number, { text: string, type: string }> = {
    1: { text: 'Economy', type: '经济型' },
    2: { text: 'Comfort', type: '舒适型' },
    3: { text: 'Upscale', type: '高档型' },
    4: { text: 'Luxury', type: '豪华套房' },
};

export interface HotelCardItemData {
    hotels: any[];
    searchState: { check_in?: string; check_out?: string };
    userLocation: { lat: number; lng: number } | null;
    calcDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}

const HotelCardItem: React.FC<{ id: string; index: number; data: any }> = ({ id, index, data: rawData }) => {
    const { hotels, searchState, userLocation, calcDistance } = rawData as HotelCardItemData;
    const hotel = hotels[index];
    if (!hotel) return <View id={id} />;

    const originalPrice = hotel.original_price || hotel.min_price;
    const savings = originalPrice > hotel.min_price ? Math.floor(originalPrice - hotel.min_price) : 0;
    const reviewCount = hotel.real_reviews_count !== undefined ? hotel.real_reviews_count : (hotel.reviews || 0);
    let distText = '';
    if (userLocation && hotel.latitude && hotel.longitude) {
        const d = calcDistance(userLocation.lat, userLocation.lng, Number(hotel.latitude), Number(hotel.longitude));
        distText = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
    }

    return (
        <View id={id} key={hotel.hotel_id} className="search-page__hotel-card" onClick={() => {
            let url = `/packageHotel/hotel-details/index?id=${hotel.hotel_id}`;
            if (searchState.check_in && searchState.check_out) url += `&check_in=${searchState.check_in}&check_out=${searchState.check_out}`;
            Taro.navigateTo({ url });
        }}>
            <View className="search-page__hotel-image-col">
                <View className="search-page__hotel-image-wrapper">
                    <Image src={hotel.image_url || 'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?auto=format&fit=crop&w=400&q=80'} className="search-page__hotel-image" mode="aspectFill" />
                    <Text className="search-page__hotel-brand-tag">易宿酒店</Text>
                    <View className="search-page__hotel-play-btn"><Text className="search-page__hotel-play-icon">▶</Text></View>
                </View>
            </View>
            <View className="search-page__hotel-content">
                <View className="search-page__hotel-content-top">
                    <View className="search-page__hotel-name-row"><Text className="search-page__hotel-name">{hotel.name}</Text></View>
                    <View className="search-page__hotel-badges">
                        {hotel.hotel_type && HOTEL_TYPE_MAP[hotel.hotel_type] && (
                            <Text className={`search-page__hotel-badge ${BADGE_CLASS_MAP[HOTEL_TYPE_MAP[hotel.hotel_type].text] || ''}`}>{HOTEL_TYPE_MAP[hotel.hotel_type].type}</Text>
                        )}
                        {hotel.star_rating > 3 && (
                            <View className="search-page__hotel-preferred-badge">
                                <Text className="search-page__hotel-preferred-icon">⭐</Text>
                                <Text>{hotel.star_rating} 星级</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View className="search-page__hotel-rating-row">
                    <View className="search-page__hotel-score-badge"><Text>{hotel.score || '4.0'}</Text></View>
                    <Text className="search-page__hotel-score-label">{(hotel.score || 4.0) >= 4.5 ? '极好' : '好'}</Text>
                    <View className="search-page__hotel-divider-v" />
                    <Text className="search-page__hotel-reviews">{reviewCount} 条点评</Text>
                </View>
                <View><Text className="search-page__hotel-quote">{(hotel.remark || '舒适体验，品质之选').substring(0, 10)}{(hotel.remark || '').length > 10 ? '...' : ''}</Text></View>
                <Text className="search-page__hotel-distance">{hotel.city_name} · {hotel.address}{distText ? ` · 距您${distText}` : ''}</Text>
                <View className="search-page__hotel-features">
                    {(hotel.parsedTags && hotel.parsedTags.length > 0) ? hotel.parsedTags.slice(0, 3).map((tag: string, i: number) => (
                        <View key={i} className={`search-page__hotel-feature-tag ${tag === '升级房型' ? 'search-page__hotel-feature-tag--blue' : 'search-page__hotel-feature-tag--gray'}`}><Text>{tag}</Text></View>
                    )) : (<><View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--blue"><Text>优享</Text></View>
                        <View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--gray"><Text>免费停车</Text></View></>)}
                </View>
                <View className="search-page__hotel-price-row">
                    <Text className="search-page__hotel-stock">{hotel.left_stock !== undefined ? (hotel.left_stock <= 3 ? `仅剩 ${hotel.left_stock} 间` : '房源充足') : '有房'}</Text>
                    <View className="search-page__hotel-price-col">
                        {savings > 0 && (<View className="search-page__hotel-original-price-row"><Text className="search-page__hotel-original-price">¥{originalPrice}</Text><Text className="search-page__hotel-save-badge">省 ¥{savings}</Text></View>)}
                        <View className="search-page__hotel-current-price">
                            <Text className="search-page__hotel-currency">¥</Text>
                            <Text className="search-page__hotel-price-value">{hotel.min_price || 0}</Text>
                            <Text className="search-page__hotel-price-suffix">起/晚</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default React.memo(HotelCardItem);
