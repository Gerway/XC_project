import React, { useState } from 'react';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { OrderStatus } from '../../../types/types';
import { hotelApi } from '../../api/hotel';
import './index.scss';

interface OrderDetail {
    order_id: string;
    user_id: string;
    hotel_id: string;
    hotel_name: string;
    hotel_address: string;
    hotel_image: string;
    room_id: string;
    room_name: string;
    room_area: number;
    room_bed: string;
    has_window: number;
    has_breakfast: number;
    check_in: string;
    check_out: string;
    nights: number;
    room_count: number;
    idcards: string;
    special_request: string;
    total_price: number;
    real_pay: number;
    status: OrderStatus;
    created_at: string;
    payed_at: string | null;
    canCancel: number;
    details: { date: string; price: number; breakfast_count: number }[];
    coupon_ids?: string[];
    used_coupons?: { user_coupons_id: string; coupon_id: string; title: string; discount_amount: number; min_spend: number }[];
    review?: {
        review_id: string;
        score: number;
        content: string;
        images?: string[];
        tags?: string[];
        created_at: string;
    } | null;
}

const OrderDetails: React.FC = () => {
    const router = useRouter();
    const { orderId } = router.params;
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const { statusBarHeight } = Taro.getSystemInfoSync();

    useDidShow(() => {
        if (!orderId) return;
        hotelApi.getOrderDetail({ order_id: orderId }).then(res => {
            if (res?.data) {
                setOrder(res.data as OrderDetail);
            }
        }).catch(err => {
            console.error('Failed to load order detail', err);
        });
    });

    if (!order) {
        return (
            <View className="order-details__not-found">
                <Text className="order-details__not-found-text">订单加载中...</Text>
            </View>
        );
    }

    const isPending = order.status === OrderStatus.PENDING;
    const isPaid = order.status === OrderStatus.PAID || order.status === OrderStatus.CHECKED_IN;
    const isCompleted = order.status === OrderStatus.COMPLETED;
    const isCancelled = order.status === OrderStatus.CANCELLED;

    const formatDateWithWeek = (dateStr: string) => {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const date = d.getDate();
        const weekMapCN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日 ${weekMapCN[d.getDay()]}`;
    };

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const h = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        const s = d.getSeconds().toString().padStart(2, '0');
        return `${y}-${m}-${day} ${h}:${min}:${s}`;
    };

    const getStatusText = () => {
        switch (order.status) {
            case OrderStatus.PENDING: return '待支付';
            case OrderStatus.PAID: return '待入住';
            case OrderStatus.CHECKED_IN: return '入住中';
            case OrderStatus.COMPLETED: return '已完成';
            case OrderStatus.CANCELLED: return '已取消';
            default: return '';
        }
    };

    const handleDelete = () => {
        Taro.showModal({
            title: '提示',
            content: '确认删除该订单吗?',
            success: (res) => {
                if (res.confirm) {
                    hotelApi.deleteOrder({ order_id: order.order_id }).then(() => {
                        Taro.showToast({ title: '已删除', icon: 'none' });
                        setTimeout(() => Taro.navigateBack(), 1000);
                    }).catch(() => {
                        Taro.showToast({ title: '删除失败', icon: 'none' });
                    });
                }
            }
        });
    };

    const handleCancel = () => {
        if (isPaid && !order.canCancel) {
            Taro.showToast({ title: '该订单不可取消', icon: 'none' });
            return;
        }
        Taro.showModal({
            title: '提示',
            content: '确认取消该订单吗?',
            success: (res) => {
                if (res.confirm) {
                    hotelApi.cancelOrder({ order_id: order.order_id }).then(() => {
                        setOrder({ ...order, status: OrderStatus.CANCELLED });
                        Taro.showToast({ title: '已取消', icon: 'none' });
                    }).catch(() => {
                        Taro.showToast({ title: '取消失败', icon: 'none' });
                    });
                }
            }
        });
    };

    const handleBookAgain = () => {
        Taro.navigateTo({ url: `/pages/hotel-details/index?id=${order.hotel_id}` });
    };

    const handlePay = () => {
        Taro.showLoading({ title: '处理支付中' });
        hotelApi.payOrder({
            order_id: order.order_id,
            real_pay: order.real_pay,
            total_price: order.total_price,
            room_count: order.room_count,
            special_request: order.special_request || '',
            idcards: order.idcards || '[]',
            daily: order.details || []
        }).then(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '支付成功', icon: 'success' });
            setOrder({ ...order, status: OrderStatus.PAID, payed_at: new Date().toISOString() });
        }).catch((e: any) => {
            Taro.hideLoading();
            const errMsg = e?.message || '支付失败';
            setTimeout(() => {
                Taro.showModal({
                    title: '支付失败',
                    content: errMsg,
                    showCancel: false,
                    confirmText: '知道了'
                });
            }, 300);
        });
    };

    const roomInfo = [
        order.room_area ? `${order.room_area}m²` : '',
        order.room_bed || '',
        order.has_window ? '有窗' : '无窗'
    ].filter(Boolean).join(' | ');

    return (
        <View className="order-details">
            <View className="order-details__header">
                <View style={{ height: `${statusBarHeight}px` }}></View>
                <View className="order-details__header-inner">
                    <View onClick={() => Taro.navigateBack()} className="order-details__back-btn">
                        <Text className="order-details__back-icon">‹</Text>
                    </View>
                    <Text className="order-details__title">订单详情</Text>
                    <View className="order-details__header-actions">
                        <Text className="order-details__header-action-icon">☎</Text>
                        <Text className="order-details__header-action-icon">⋯</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className="order-details__main" style={{ marginTop: `${(statusBarHeight || 20) + 44}px` }}>
                {/* Status Section */}
                <View className="order-details__status-section">
                    <View className="order-details__status-title">
                        <Text>{getStatusText()}</Text>
                    </View>
                </View>

                {/* Payment Card */}
                {isPending && (
                    <View className="order-details__card">
                        <View className="order-details__payment-header">
                            <Text className="order-details__payment-label">在线付</Text>
                            <View className="order-details__payment-amount">
                                <Text className="order-details__payment-currency">¥</Text>
                                <Text className="order-details__payment-value">{order.real_pay.toFixed(2)}</Text>
                            </View>
                        </View>
                        {order.canCancel ? (
                            <View className="order-details__cancel-policy">
                                <Text className="order-details__cancel-label">取消政策</Text>
                                <Text className="order-details__cancel-text">支付后可免费取消。</Text>
                            </View>
                        ) : (
                            <View className="order-details__cancel-policy">
                                <Text className="order-details__cancel-label">取消政策</Text>
                                <Text className="order-details__cancel-text">该订单支付后不可取消。</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Hotel Info Card */}
                <View className="order-details__card">
                    <View className="order-details__hotel-row" onClick={() => Taro.navigateTo({ url: `/pages/hotel-details/index?id=${order.hotel_id}` })}>
                        <View className="order-details__hotel-thumb">
                            <Image src={order.hotel_image} mode="aspectFill" className="order-details__hotel-thumb-img" />
                        </View>
                        <View className="order-details__hotel-info">
                            <Text className="order-details__hotel-name">{order.hotel_name}</Text>
                            <View className="order-details__hotel-address">
                                <Text className="order-details__hotel-address-text">{order.hotel_address || '暂无地址信息'}</Text>
                                <Text className="order-details__hotel-address-arrow">›</Text>
                            </View>
                        </View>
                    </View>

                    <View className="order-details__action-buttons">
                        <View className="order-details__action-btn">
                            <Text className="order-details__action-btn-icon">⚲</Text>
                            <Text>导航/地图</Text>
                        </View>
                        <View className="order-details__action-btn">
                            <Text className="order-details__action-btn-icon">☏</Text>
                            <Text>联系酒店</Text>
                        </View>
                    </View>
                </View>

                {/* Booking Details Card */}
                <View className="order-details__card order-details__card--spaced">
                    <View className="order-details__detail-row">
                        <Text className="order-details__detail-icon">◷</Text>
                        <View className="order-details__detail-dates">
                            <Text className="order-details__detail-date">{formatDateWithWeek(order.check_in)}</Text>
                            <Text className="order-details__detail-nights">共{order.nights}晚</Text>
                            <Text className="order-details__detail-date">{formatDateWithWeek(order.check_out)}</Text>
                        </View>
                    </View>

                    <View className="order-details__detail-row order-details__detail-row--top">
                        <Text className="order-details__detail-icon order-details__detail-icon--top">☖</Text>
                        <View style={{ flex: 1 }}>
                            <View className="order-details__detail-room-row">
                                <Text className="order-details__detail-room-name">{order.room_name} {order.room_count || 1}间</Text>
                            </View>
                            {roomInfo && (
                                <View className="order-details__detail-room-info">
                                    <Text>{roomInfo}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Price Breakdown (if details exist) */}
                {order.details && order.details.length > 0 && (
                    <View className="order-details__card order-details__card--spaced">
                        <Text className="order-details__order-info-title">价格明细</Text>
                        {order.details.map((d, i) => {
                            const dateObj = new Date(d.date);
                            const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                            const day = dateObj.getDate().toString().padStart(2, '0');
                            return (
                                <View key={i} className="order-details__info-row">
                                    <Text className="order-details__info-label">{m}月{day}日 房费{d.breakfast_count > 0 ? `(含${d.breakfast_count}份早餐)` : ''}</Text>
                                    <Text className="order-details__info-value">¥{d.price.toFixed(2)}</Text>
                                </View>
                            );
                        })}
                        <View className="order-details__price-summary">
                            {/* 优惠券抵扣 */}
                            {order.used_coupons && order.used_coupons.length > 0 && (
                                order.used_coupons.map((c, i) => (
                                    <View key={i} className="order-details__info-row">
                                        <Text className="order-details__info-label">🎫 {c.title}</Text>
                                        <Text className="order-details__info-value" style={{ color: '#FF6B35' }}>-¥{c.discount_amount.toFixed(2)}</Text>
                                    </View>
                                ))
                            )}
                            <View className="order-details__info-row">
                                <Text className="order-details__info-label">总价</Text>
                                <Text className="order-details__info-value">¥{order.total_price.toFixed(2)}</Text>
                            </View>
                            <View className="order-details__info-row">
                                <Text className="order-details__info-label order-details__info-label--bold">实付</Text>
                                <Text className="order-details__info-value order-details__info-value--accent">¥{order.real_pay.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Order Info */}
                <View className="order-details__card order-details__card--spaced order-details__card--mb">
                    <Text className="order-details__order-info-title">订单信息</Text>
                    <View className="order-details__info-row">
                        <Text className="order-details__info-label">订单号</Text>
                        <View className="order-details__info-value">
                            <Text>{order.order_id}</Text>
                        </View>
                    </View>
                    <View className="order-details__info-row">
                        <Text className="order-details__info-label">下单时间</Text>
                        <Text className="order-details__info-value">{formatDateTime(order.created_at)}</Text>
                    </View>
                    {order.payed_at && (
                        <View className="order-details__info-row">
                            <Text className="order-details__info-label">支付时间</Text>
                            <Text className="order-details__info-value">{formatDateTime(order.payed_at)}</Text>
                        </View>
                    )}
                    {order.special_request && (
                        <View className="order-details__info-row">
                            <Text className="order-details__info-label">特殊要求</Text>
                            <Text className="order-details__info-value">{order.special_request}</Text>
                        </View>
                    )}
                </View>

                {/* Review Section (for completed orders) */}
                {isCompleted && order.review && (
                    <View className="order-details__card order-details__card--spaced">
                        <Text className="order-details__order-info-title">我的评价</Text>
                        <View className="order-details__review-section">
                            <View className="order-details__review-score-row">
                                <Text className="order-details__review-score-label">评分</Text>
                                <View className="order-details__review-stars-row">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Text key={i} style={{ color: i <= order.review!.score ? '#ff7d00' : '#e0e0e0', fontSize: '16px' }}>★</Text>
                                    ))}
                                    <Text style={{ marginLeft: '8px', color: '#ff7d00', fontWeight: 'bold' }}>{order.review.score}分</Text>
                                </View>
                            </View>
                            <Text className="order-details__review-content">{order.review.content}</Text>
                            {order.review.tags && order.review.tags.length > 0 && (
                                <View className="order-details__review-tags">
                                    {order.review.tags.map((tag, i) => (
                                        <Text key={i} className="order-details__review-tag">{tag}</Text>
                                    ))}
                                </View>
                            )}
                            <Text className="order-details__review-date">评价于 {order.review.created_at?.slice(0, 10)}</Text>
                        </View>
                    </View>
                )}

                {/* Write Review Button (for completed orders without review) */}
                {isCompleted && !order.review && (
                    <View className="order-details__card order-details__card--spaced">
                        <View
                            className="order-details__write-review-btn"
                            onClick={() => Taro.navigateTo({ url: `/pages/write-review/index?orderId=${order.order_id}&hotelId=${order.hotel_id}` })}
                        >
                            <Text className="order-details__write-review-text">写评价</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: '80px' }}></View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="order-details__footer">
                <View className="order-details__footer-inner">
                    {(isCancelled || isCompleted) && (
                        <View onClick={handleDelete} className="order-details__footer-btn order-details__footer-btn--outline">
                            <Text>删除订单</Text>
                        </View>
                    )}

                    {(isPending || isPaid) && (
                        <View onClick={handleCancel} className="order-details__footer-btn order-details__footer-btn--outline">
                            <Text>取消订单</Text>
                        </View>
                    )}

                    <View onClick={handleBookAgain} className="order-details__footer-btn order-details__footer-btn--outline">
                        <Text>再次预订</Text>
                    </View>

                    {isPending && (
                        <View onClick={handlePay} className="order-details__footer-btn order-details__footer-btn--primary">
                            <Text>去支付</Text>
                        </View>
                    )}
                </View>
            </View>

        </View>
    );
};

export default OrderDetails;
