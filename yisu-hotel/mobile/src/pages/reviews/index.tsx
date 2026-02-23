import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { hotelApi } from '../../api/hotel';
import './index.scss';

interface ReviewItem {
    review_id: string;
    content: string;
    score: number;
    created_at: string;
    images: any;
    tags: string[];
    username: string;
    avatar: string;
}

interface TagStat {
    label: string;
    count: number;
}

interface ReviewsData {
    hotel_score: number;
    reviews_count: number;
    tabs: {
        all: number;
        has_image: number;
        excellent: number;
        good: number;
    };
    tag_stats: TagStat[];
    reviews: ReviewItem[];
}

const Reviews: React.FC = () => {
    const router = useRouter();
    const { id } = router.params;

    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);

    const { statusBarHeight } = Taro.getSystemInfoSync();

    useEffect(() => {
        if (!id) return;
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const res = await hotelApi.getHotelReviews({ hotel_id: id });
                if (res?.data) {
                    setReviewsData(res.data);
                }
            } catch (e) {
                console.error('fetchReviews error', e);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [id]);



    const getScoreLabel = (score: number) => {
        if (score >= 4.5) return '"极好"';
        if (score >= 4.0) return '"很好"';
        if (score >= 3.0) return '"好"';
        return '"一般"';
    };

    // 根据 Tab 筛选评论
    const getFilteredReviews = (): ReviewItem[] => {
        if (!reviewsData) return [];
        const all = reviewsData.reviews;
        switch (activeTab) {
            case 'has_image':
                return all.filter(r => {
                    try {
                        const imgs = typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []);
                        return imgs.length > 0;
                    } catch { return false; }
                });
            case 'excellent':
                return all.filter(r => r.score >= 4.5);
            case 'good':
                return all.filter(r => r.score >= 3 && r.score < 4.5);
            default:
                return all;
        }
    };

    const tabs = reviewsData ? [
        { key: 'all', label: '全部', count: reviewsData.tabs.all },
        { key: 'has_image', label: '有图', count: reviewsData.tabs.has_image },
        { key: 'excellent', label: '好评', count: reviewsData.tabs.excellent },
        { key: 'good', label: '中评', count: reviewsData.tabs.good }
    ] : [];

    const filteredReviews = getFilteredReviews();

    return (
        <View className="reviews-page">
            <View className="reviews-page__header">
                <View style={{ height: `${statusBarHeight}px` }}></View>
                <View className="reviews-page__header-inner">
                    <View onClick={() => Taro.navigateBack()} className="reviews-page__back-btn">
                        <Text className="reviews-page__back-icon">‹</Text>
                    </View>
                    <Text className="reviews-page__title">用户评价</Text>
                    <View className="reviews-page__spacer"></View>
                </View>
            </View>

            <ScrollView scrollY className="reviews-page__content">
                {loading ? (
                    <View style={{ padding: '40px 0', textAlign: 'center' }}>
                        <Text>加载中...</Text>
                    </View>
                ) : !reviewsData ? (
                    <View style={{ padding: '40px 0', textAlign: 'center' }}>
                        <Text>暂无评价数据</Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Section */}
                        <View className="reviews-page__summary">
                            <View className="reviews-page__summary-inner">
                                <View className="reviews-page__summary-left">
                                    <Text className="reviews-page__summary-score">{reviewsData.hotel_score}</Text>
                                    <View className="reviews-page__summary-meta">
                                        <View className="reviews-page__summary-label-row">
                                            <Text className="reviews-page__summary-label">{getScoreLabel(reviewsData.hotel_score)}</Text>
                                            <View className="reviews-page__summary-stars">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <View key={i} className="reviews-page__summary-star">
                                                        <Text className="reviews-page__summary-star-icon">★</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                        <Text className="reviews-page__summary-count">
                                            {reviewsData.reviews_count} 条评价
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Sticky Tabs */}
                        <View className="reviews-page__sticky-tabs">
                            <View className="reviews-page__tabs-inner">
                                <ScrollView scrollX className="reviews-page__tabs-list" scrollWithAnimation>
                                    <View style={{ display: 'flex', gap: '24px' }}>
                                        {tabs.map(tab => (
                                            <View
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                className={`reviews-page__tab ${activeTab === tab.key ? 'reviews-page__tab--active' : ''}`}
                                            >
                                                <View className="reviews-page__tab-label-row">
                                                    <Text className="reviews-page__tab-label">{tab.label}</Text>
                                                    {tab.count > 0 && <Text className="reviews-page__tab-count">{tab.count}</Text>}
                                                </View>
                                                {activeTab === tab.key && <View className="reviews-page__tab-indicator"></View>}
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        </View>

                        {/* Tags Cloud */}
                        {reviewsData.tag_stats.length > 0 && (
                            <View className="reviews-page__tags">
                                <View className="reviews-page__tags-list">
                                    {reviewsData.tag_stats.map(tag => (
                                        <View key={tag.label} className="reviews-page__tag">
                                            <Text>{tag.label} </Text>
                                            <Text className="reviews-page__tag-count">{tag.count}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Review List */}
                        <View className="reviews-page__list">
                            {filteredReviews.length === 0 ? (
                                <View style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <Text style={{ color: '#999' }}>该分类暂无评价</Text>
                                </View>
                            ) : (
                                filteredReviews.map(review => (
                                    <View key={review.review_id} className="reviews-page__review-item">
                                        {/* Header: User Info */}
                                        <View className="reviews-page__reviewer-info">
                                            <View className="reviews-page__reviewer-avatar">
                                                <Text className="reviews-page__reviewer-avatar-icon">👤</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Text className="reviews-page__reviewer-name">{review.username}</Text>
                                                </View>
                                                <Text className="reviews-page__reviewer-stay">{review.created_at?.slice(0, 10)} 发表</Text>
                                            </View>
                                        </View>

                                        {/* Score & Tags */}
                                        <View className="reviews-page__score-row">
                                            <View className="reviews-page__score-badge"><Text>{review.score}</Text></View>
                                            {review.tags && review.tags.map(tag => (
                                                <Text key={tag} className="reviews-page__review-tag">{tag}</Text>
                                            ))}
                                        </View>

                                        {/* Content */}
                                        <Text className="reviews-page__review-content">
                                            {review.content}
                                        </Text>

                                        {/* Actions */}
                                        <View className="reviews-page__review-actions">
                                            <View className="reviews-page__helpful-btn" onClick={() => Taro.showToast({ title: '感谢反馈', icon: 'none' })}>
                                                <Text className="reviews-page__helpful-icon">👍</Text>
                                                <Text>有用</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}

                            <View className="reviews-page__end-text">
                                <Text>没有更多评价了</Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default Reviews;
