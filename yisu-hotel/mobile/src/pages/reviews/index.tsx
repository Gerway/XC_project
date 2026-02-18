import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter, usePageScroll } from '@tarojs/taro';
import { HOTELS } from '../../constants';
import './index.scss';

const REVIEWS_DATA = [
    {
        id: 1,
        user: 'Dong**',
        level: 'Gold Member',
        date: 'Feb 2026',
        room: 'Superior King Room',
        score: 5.0,
        tags: ['Nice Bathroom', 'Room is Good', 'Quiet'],
        content: 'The stay was very good. ',
        reply: {
            content: 'Dear guest, thank you for your review. We are glad you enjoyed the bathroom and the quietness of the room. We look forward to seeing you again!'
        },
        helpful: false
    },
    {
        id: 2,
        user: 'Zhou*',
        level: 'Gold Member',
        date: 'Feb 2026',
        room: 'Superior King Room',
        score: 5.0,
        tags: ['Clean', 'Good Service', 'Near Metro'],
        content: 'Two minutes walk from the high-speed rail station, very convenient. Front desk service is also very good, warm and thoughtful. The room is on a high floor, clean and hygienic.',
        reply: {
            content: '【Convenient transportation, 100m from Chongqing West Station】Dear guest, thank you very much for your praise! It is our honor to provide you with a comfortable stay. We hope you have a wonderful journey!'
        },
        helpful: false
    },
    {
        id: 3,
        user: 'Sarah M.',
        level: 'Silver Member',
        date: 'Jan 2026',
        room: 'Deluxe Twin Room',
        score: 4.8,
        tags: ['Great View', 'Spacious'],
        content: 'The view from the room was absolutely stunning, overlooking the city skyline. The room was spacious enough for two people. Breakfast was delicious with many options.',
        helpful: true
    },
    {
        id: 4,
        user: 'Michael T.',
        level: 'Platinum Member',
        date: 'Jan 2026',
        room: 'Executive Suite',
        score: 5.0,
        tags: ['Luxury', 'Best Service', 'Lounge Access'],
        content: 'As a platinum member, I was upgraded to the Executive Suite. The lounge access was fantastic, great evening cocktails. Staff went above and beyond.',
        reply: {
            content: 'Dear Michael, thank you for your loyalty! We are thrilled to hear you enjoyed the upgrade and the lounge services. See you next time!'
        },
        helpful: true
    },
    {
        id: 5,
        user: 'Guest_992',
        level: 'Member',
        date: 'Dec 2025',
        room: 'Standard Queen Room',
        score: 4.5,
        tags: ['Good Value', 'Clean'],
        content: 'Good value for money. The location is perfect for tourists. Room was clean, although a bit small.',
        helpful: false
    }
];

const Reviews: React.FC = () => {
    const router = useRouter();
    const { id } = router.params;
    // const hotel = HOTELS.find(h => h.hotel_id === id) || HOTELS[0]; 

    const [activeTab, setActiveTab] = useState('All');
    const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
    // const [isSticky, setIsSticky] = useState(false); // Can implement intersection observer if needed

    const { statusBarHeight } = Taro.getSystemInfoSync();

    const toggleReply = (id: number) => {
        setExpandedReplies(prev =>
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    };

    const tabs = [
        { label: 'All', count: '' },
        { label: 'Images/Video', count: 106 },
        { label: 'Excellent', count: 833 },
        { label: 'Good', count: 39 }
    ];

    const tags = [
        { label: 'Good Service', count: 231 },
        { label: 'Clean & Tidy', count: 207 },
        { label: 'Convenient', count: 177 },
        { label: 'Quiet', count: 163 },
        { label: 'Nice Room', count: 155 },
        { label: 'Near Metro', count: 145 }
    ];

    usePageScroll((res) => {
        // Handle sticky header logic if manually needed, but CSS sticky positions usually work in scroll-view if configured right
    });

    return (
        <View className="reviews-page">
            <View className="reviews-page__header">
                <View style={{ height: `${statusBarHeight}px` }}></View>
                <View className="reviews-page__header-inner">
                    <View onClick={() => Taro.navigateBack()} className="reviews-page__back-btn">
                        <Text className="reviews-page__back-icon">‹</Text>
                    </View>
                    <Text className="reviews-page__title">Guest Reviews</Text>
                    <View className="reviews-page__spacer"></View>
                </View>
            </View>

            <ScrollView scrollY className="reviews-page__content">
                {/* Summary Section */}
                <View className="reviews-page__summary">
                    <View className="reviews-page__summary-inner">
                        <View className="reviews-page__summary-left">
                            <Text className="reviews-page__summary-score">4.8</Text>
                            <View className="reviews-page__summary-meta">
                                <View className="reviews-page__summary-label-row">
                                    <Text className="reviews-page__summary-label">"Excellent"</Text>
                                    <View className="reviews-page__summary-stars">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <View key={i} className="reviews-page__summary-star">
                                                <Text className="reviews-page__summary-star-icon">★</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <Text className="reviews-page__summary-count">
                                    5,086 reviews
                                </Text>
                            </View>
                        </View>
                        <View className="reviews-page__summary-rules">
                            <Text>Review Rules</Text>
                            <Text className="reviews-page__summary-rules-icon">?</Text>
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
                                        key={tab.label}
                                        onClick={() => setActiveTab(tab.label)}
                                        className={`reviews-page__tab ${activeTab === tab.label ? 'reviews-page__tab--active' : ''}`}
                                    >
                                        <View className="reviews-page__tab-label-row">
                                            <Text className="reviews-page__tab-label">{tab.label}</Text>
                                            {tab.count && <Text className="reviews-page__tab-count">{tab.count}</Text>}
                                        </View>
                                        {activeTab === tab.label && <View className="reviews-page__tab-indicator"></View>}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                        <View className="reviews-page__filter-btn">
                            <Text>Filter</Text>
                            <Text className="reviews-page__filter-icon">≡</Text>
                        </View>
                    </View>
                </View>

                {/* Tags Cloud */}
                <View className="reviews-page__tags">
                    <View className="reviews-page__tags-list">
                        {tags.map(tag => (
                            <View key={tag.label} className="reviews-page__tag">
                                <Text>{tag.label} </Text>
                                <Text className="reviews-page__tag-count">{tag.count}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Review List */}
                <View className="reviews-page__list">
                    {REVIEWS_DATA.map(review => (
                        <View key={review.id} className="reviews-page__review-item">
                            {/* Header: User Info */}
                            <View className="reviews-page__reviewer-info">
                                <View className="reviews-page__reviewer-avatar">
                                    <Text className="reviews-page__reviewer-avatar-icon">👤</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Text className="reviews-page__reviewer-name">{review.user}</Text>
                                        <Text className="reviews-page__reviewer-badge">{review.level}</Text>
                                    </View>
                                    <Text className="reviews-page__reviewer-stay">{review.date} Stayed in {review.room}</Text>
                                </View>
                            </View>

                            {/* Score & Badges */}
                            <View className="reviews-page__score-row">
                                <View className="reviews-page__score-badge"><Text>{review.score}</Text></View>
                                {review.tags.map(tag => (
                                    <Text key={tag} className="reviews-page__review-tag">{tag}</Text>
                                ))}
                            </View>

                            {/* Content */}
                            <Text className="reviews-page__review-content">
                                {review.content}
                            </Text>

                            {/* Hotel Reply */}
                            {review.reply && (
                                <View className="reviews-page__reply-box">
                                    <View className={`reviews-page__reply-text-container ${expandedReplies.includes(review.id) ? '' : 'reviews-page__reply-text-container--clamped'}`}>
                                        <Text className="reviews-page__reply-label">Hotel Reply: </Text>
                                        <Text className="reviews-page__reply-text">{review.reply.content}</Text>
                                    </View>
                                    <View
                                        onClick={() => toggleReply(review.id)}
                                        className="reviews-page__reply-toggle"
                                    >
                                        <Text>{expandedReplies.includes(review.id) ? 'Collapse' : 'Expand'}</Text>
                                        <Text className={`reviews-page__reply-toggle-icon ${expandedReplies.includes(review.id) ? 'reviews-page__reply-toggle-icon--expanded' : ''}`}>▼</Text>
                                    </View>
                                </View>
                            )}

                            {/* Actions */}
                            <View className="reviews-page__review-actions">
                                <View className="reviews-page__helpful-btn" onClick={() => Taro.showToast({ title: 'Thanks for feedback', icon: 'none' })}>
                                    <Text className="reviews-page__helpful-icon">👍</Text>
                                    <Text>Helpful</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    <View className="reviews-page__end-text">
                        <Text>No more reviews</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default Reviews;
