import React from 'react';
import { View } from '@tarojs/components';
import './HotelCardSkeleton.scss';

interface Props {
    count?: number;
}

const HotelCardSkeleton: React.FC<Props> = ({ count = 5 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} className="skeleton-card">
                    <View className="skeleton-card__image skeleton-shimmer" />
                    <View className="skeleton-card__info">
                        <View className="skeleton-card__title skeleton-shimmer" />
                        <View className="skeleton-card__subtitle skeleton-shimmer" />
                        <View className="skeleton-card__tags">
                            <View className="skeleton-card__tag skeleton-shimmer" />
                            <View className="skeleton-card__tag skeleton-shimmer" />
                        </View>
                        <View className="skeleton-card__bottom">
                            <View className="skeleton-card__score skeleton-shimmer" />
                            <View className="skeleton-card__price skeleton-shimmer" />
                        </View>
                    </View>
                </View>
            ))}
        </>
    );
};

export default HotelCardSkeleton;
