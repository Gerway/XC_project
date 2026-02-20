import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import { Hotel } from '../../../types/types';
import './HotelCard.scss';

interface HotelCardProps {
    hotel: Hotel;
    onClick?: () => void;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onClick }) => {
    return (
        <View className="hotel-card" onClick={onClick}>
            <View className="hotel-card__image-wrapper">
                <Image src={hotel.image_url} className="hotel-card__image" mode="aspectFill" />
                <View className="hotel-card__favorite-btn" onClick={(e) => e.stopPropagation()}>
                    <Text className="material-symbols-outlined hotel-card__favorite-icon">favorite</Text>
                </View>
                {hotel.tags && hotel.tags[0] && (
                    <Text className="hotel-card__badge">{hotel.tags[0]}</Text>
                )}
            </View>
            <View className="hotel-card__content">
                <Text className="hotel-card__name">{hotel.name}</Text>
                <View className="hotel-card__rating">
                    <Text className="material-symbols-outlined hotel-card__star-icon filled">star</Text>
                    <Text className="hotel-card__score">{hotel.score}</Text>
                    <Text className="hotel-card__reviews-count">{hotel.reviews_count} Reviews</Text>
                </View>
                <View className="hotel-card__footer">
                    <View className="hotel-card__tags">
                        {hotel.tags?.slice(0, 2).map((tag, i) => (
                            <Text key={i} className="hotel-card__tag">{tag}</Text>
                        ))}
                    </View>
                    <View className="hotel-card__price-wrapper">
                        <Text className="hotel-card__currency">¥</Text>
                        <Text className="hotel-card__price">{hotel.min_price}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default HotelCard;
