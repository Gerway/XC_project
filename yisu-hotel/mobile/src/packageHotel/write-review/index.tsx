import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { hotelApi } from '../../api/hotel';
import './index.scss';

const SCORE_LABELS: Record<number, string> = {
    1: '很差',
    2: '较差',
    3: '一般',
    4: '很好',
    5: '极好'
};

const AVAILABLE_TAGS = [
    '干净', '卫生', '服务好', '设施好', '环境优美',
    '安静', '宽敞', '性价比高', '位置方便', '舒适'
];

const WriteReview: React.FC = () => {
    const router = useRouter();
    const { orderId } = router.params;

    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState<any>(null);

    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const { statusBarHeight } = Taro.getSystemInfoSync();

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        const fetchOrder = async () => {
            try {
                const res = await hotelApi.getOrderDetail({ order_id: orderId });
                if (res?.data) {
                    setOrderData(res.data);
                }
            } catch (err) {
                console.error('fetch order error', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (score === 0) {
            Taro.showToast({ title: '请先选择评分', icon: 'none' });
            return;
        }
        if (!content.trim()) {
            Taro.showToast({ title: '请填写评价内容', icon: 'none' });
            return;
        }

        const userInfoStr = Taro.getStorageSync('userInfo');
        if (!userInfoStr) {
            Taro.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        let userInfo;
        try {
            userInfo = typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr;
        } catch {
            userInfo = userInfoStr;
        }

        setSubmitting(true);
        try {
            const res = await hotelApi.addReview({
                order_id: orderId || '',
                hotel_id: orderData?.hotel_id || '',
                user_id: userInfo.user_id,
                score,
                content: content.trim(),
                tags: selectedTags,
                images: []
            });

            Taro.showToast({ title: '评价提交成功！', icon: 'success' });
            setTimeout(() => {
                Taro.navigateBack();
            }, 1500);
        } catch (err: any) {
            console.error('Submit review error:', err);
            // Taro request wrapper might return error in err.data.message or err.response.data.message
            const msg = err?.data?.message || err?.response?.data?.message || err?.message || '该订单已评价过或提交失败';
            Taro.showToast({ title: msg, icon: 'none', duration: 2500 });
        } finally {
            setSubmitting(false);
        }
    };

    const displayScore = hoverScore || score;

    return (
        <View className="write-review">
            {/* Header */}
            <View className="write-review__header">
                <View style={{ height: `${statusBarHeight}px` }} />
                <View className="write-review__header-inner">
                    <View className="write-review__close-btn" onClick={() => Taro.navigateBack()}>
                        <Text className="write-review__close-icon">✕</Text>
                    </View>
                    <Text className="write-review__title">发表评价</Text>
                    <View style={{ width: 32 }} />
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text>加载中...</Text>
                </View>
            ) : !orderData ? (
                <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text>无法获取订单信息</Text>
                </View>
            ) : (
                <ScrollView scrollY className="write-review__scroll">
                    {/* Hotel Info Card */}
                    <View className="write-review__hotel-card">
                        {orderData.hotel_image ? (
                            <Image
                                src={orderData.hotel_image}
                                className="write-review__hotel-img"
                                mode="aspectFill"
                            />
                        ) : (
                            <View className="write-review__hotel-img-placeholder">
                                <Text>🏨</Text>
                            </View>
                        )}
                        <View className="write-review__hotel-info">
                            <Text className="write-review__hotel-name">{orderData.hotel_name || '酒店'}</Text>
                            <Text className="write-review__hotel-dates">
                                {orderData.check_in} ~ {orderData.check_out} · {orderData.nights || '?'} 晚
                            </Text>
                            <View className="write-review__verified-tag">
                                <Text className="write-review__verified-icon">✓</Text>
                                <Text className="write-review__verified-text">已验证入住</Text>
                            </View>
                        </View>
                    </View>

                    {/* Rating Question */}
                    <View className="write-review__rating-section">
                        <Text className="write-review__rating-question">您的入住体验如何？</Text>
                        <Text className="write-review__rating-sub">您的反馈帮助我们持续改进</Text>

                        {/* Stars */}
                        <View className="write-review__stars">
                            {[1, 2, 3, 4, 5].map(i => (
                                <View
                                    key={i}
                                    className={`write-review__star ${i <= displayScore ? 'write-review__star--active' : ''}`}
                                    onClick={() => setScore(i)}
                                >
                                    <Text className="write-review__star-icon">★</Text>
                                </View>
                            ))}
                        </View>

                        {displayScore > 0 && (
                            <Text className="write-review__score-label">{SCORE_LABELS[displayScore]}</Text>
                        )}
                    </View>

                    {/* Tags Selection */}
                    <View className="write-review__section">
                        <Text className="write-review__section-title">选择标签（可多选）</Text>
                        <View className="write-review__tags-grid">
                            {AVAILABLE_TAGS.map(tag => (
                                <View
                                    key={tag}
                                    className={`write-review__tag ${selectedTags.includes(tag) ? 'write-review__tag--selected' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    <Text>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Text Input */}
                    <View className="write-review__section">
                        <Text className="write-review__section-title">撰写评价</Text>
                        <View className="write-review__textarea-wrap">
                            <Textarea
                                className="write-review__textarea"
                                placeholder="分享您的入住感受，包括房间、服务、设施等..."
                                placeholderClass="write-review__textarea-placeholder"
                                value={content}
                                onInput={e => setContent(e.detail.value)}
                                maxlength={500}
                                autoHeight={false}
                            />
                            <Text className="write-review__char-count">{content.length}/500</Text>
                        </View>
                    </View>

                    {/* Bottom spacer for submit button */}
                    <View style={{ height: '100px' }} />
                </ScrollView>
            )}

            {/* Submit Button */}
            <View className="write-review__submit-wrap">
                <View
                    className={`write-review__submit-btn ${submitting ? 'write-review__submit-btn--disabled' : ''}`}
                    onClick={!submitting ? handleSubmit : undefined}
                >
                    <Text className="write-review__submit-text">
                        {submitting ? '提交中...' : '提交评价 →'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default WriteReview;
