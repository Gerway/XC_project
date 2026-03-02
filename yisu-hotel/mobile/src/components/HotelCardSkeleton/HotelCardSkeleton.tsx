import React from 'react';
import { View } from '@tarojs/components';
import './HotelCardSkeleton.scss';

interface Props {
    count?: number;
}

/**
 * 骨架屏结构完全镜像 HotelCardItem 的真实布局：
 * hotel-card > image-col (110x150) + content (name / badges / rating / quote / distance / features / price)
 */
const HotelCardSkeleton: React.FC<Props> = ({ count = 5 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} className="skeleton-card">
                    {/* 左侧图片区 — 与 search-page__hotel-image-col 对齐 */}
                    <View className="skeleton-card__image skeleton-shimmer" />

                    {/* 右侧信息区 — 与 search-page__hotel-content 对齐 */}
                    <View className="skeleton-card__info">
                        {/* 酒店名称 */}
                        <View className="skeleton-card__name skeleton-shimmer" />
                        {/* 徽章行 (经济型 / 星级) */}
                        <View className="skeleton-card__badges">
                            <View className="skeleton-card__badge skeleton-shimmer" />
                            <View className="skeleton-card__badge skeleton-card__badge--wide skeleton-shimmer" />
                        </View>
                        {/* 评分行 (评分 好 | xx条点评) */}
                        <View className="skeleton-card__rating">
                            <View className="skeleton-card__score skeleton-shimmer" />
                            <View className="skeleton-card__rating-text skeleton-shimmer" />
                        </View>
                        {/* 点评语 */}
                        <View className="skeleton-card__quote skeleton-shimmer" />
                        {/* 地址行 */}
                        <View className="skeleton-card__address skeleton-shimmer" />
                        {/* 标签行 (优享 / 免费停车) */}
                        <View className="skeleton-card__tags">
                            <View className="skeleton-card__tag skeleton-shimmer" />
                            <View className="skeleton-card__tag skeleton-shimmer" />
                        </View>
                        {/* 底部价格行 */}
                        <View className="skeleton-card__bottom">
                            <View className="skeleton-card__stock skeleton-shimmer" />
                            <View className="skeleton-card__price skeleton-shimmer" />
                        </View>
                    </View>
                </View>
            ))}
        </>
    );
};

export default HotelCardSkeleton;
