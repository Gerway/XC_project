import React, { useState } from 'react';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import { Order, OrderStatus } from '../../../types/types';
import { HOTELS } from '../../constants';
import './index.scss';

const OrderDetails: React.FC = () => {
    const router = useRouter();
    const { orderId } = router.params;
    const [order, setOrder] = useState<Order | null>(null);
    const [hotel, setHotel] = useState<any>(null); // Using any for HOTEL implicit type
    const { statusBarHeight } = Taro.getSystemInfoSync();

    useDidShow(() => {
        try {
            const raw = Taro.getStorageSync('orders');
            if (raw) {
                const orders: Order[] = JSON.parse(raw);
                const foundOrder = orders.find(o => o.order_id === orderId);

                if (foundOrder) {
                    setOrder(foundOrder);
                    const foundHotel = HOTELS.find(h => h.hotel_id === foundOrder.hotel_id);
                    setHotel(foundHotel || null);
                }
            }
        } catch (e) {
            console.error('Failed to load order details', e);
        }
    });

    if (!order) {
        return (
            <View className="order-details__not-found">
                <Text className="order-details__not-found-text">Order not found</Text>
                <Button onClick={() => Taro.navigateBack()} className="order-details__not-found-link">Back</Button>
            </View>
        );
    }

    const isPending = order.status === OrderStatus.PENDING;
    const isCompleted = order.status === OrderStatus.COMPLETED;
    const isCancelled = order.status === OrderStatus.CANCELLED;

    const formatDateWithWeek = (dateStr: string) => {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const date = d.getDate();
        const weekMapCN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日 ${weekMapCN[d.getDay()]}`;
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
                    try {
                        const raw = Taro.getStorageSync('orders');
                        if (raw) {
                            const orders: Order[] = JSON.parse(raw);
                            const newOrders = orders.filter(o => o.order_id !== order.order_id);
                            Taro.setStorageSync('orders', JSON.stringify(newOrders));
                            Taro.showToast({ title: '已删除', icon: 'none' });
                            setTimeout(() => Taro.navigateBack(), 1000);
                        }
                    } catch (e) {
                        console.error('Failed to delete order', e);
                    }
                }
            }
        });
    };

    const handleAction = (type: string) => {
        if (type === 'pay') {
            Taro.showToast({ title: '支付功能开发中', icon: 'none' });
        } else if (type === 'cancel') {
            // Logic to cancel order (update status)
            try {
                const raw = Taro.getStorageSync('orders');
                if (raw) {
                    const orders: Order[] = JSON.parse(raw);
                    const idx = orders.findIndex(o => o.order_id === order.order_id);
                    if (idx > -1) {
                        orders[idx].status = OrderStatus.CANCELLED;
                        Taro.setStorageSync('orders', JSON.stringify(orders));
                        setOrder({ ...orders[idx] });
                        Taro.showToast({ title: '已取消', icon: 'none' });
                    }
                }
            } catch (e) { }
        } else if (type === 'book_again') {
            Taro.navigateTo({ url: `/pages/hotel-details/index?id=${order.hotel_id}` });
        }
    };

    return (
        <View className="order-details">
            <View className="order-details__header">
                {/* Status bar spacer for custom nav */}
                <View style={{ height: `${statusBarHeight}px` }}></View>

                <View className="order-details__header-inner">
                    <View onClick={() => Taro.navigateBack()} className="order-details__back-btn">
                        <Text className="order-details__back-icon">‹</Text>
                    </View>
                    <Text className="order-details__title">订单详情</Text>
                    <View className="order-details__header-actions">
                        <Text className="order-details__header-action-icon">🎧</Text>
                        <Text className="order-details__header-action-icon">⋮</Text>
                    </View>
                </View>
            </View>

            <ScrollView scrollY className="order-details__main" style={{ marginTop: `${(statusBarHeight || 20) + 44}px` }}>
                {/* Status Section */}
                <View className="order-details__status-section">
                    <View className="order-details__status-title">
                        <Text>{getStatusText()}</Text>
                        {isPending && <Text className="order-details__status-countdown">17:50 后未支付将被取消</Text>}
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
                                <View className="order-details__payment-detail">
                                    <Text>明细 </Text>
                                    <Text className="order-details__payment-detail-arrow">›</Text>
                                </View>
                            </View>
                        </View>
                        <View className="order-details__cancel-policy">
                            <Text className="order-details__cancel-label">取消政策</Text>
                            <Text className="order-details__cancel-text">
                                支付后1小时内可免费取消，超过1小时后不可取消。
                            </Text>
                        </View>
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
                                <Text className="order-details__hotel-address-text">{hotel?.address || 'Hotel Address Info'}</Text>
                                <Text className="order-details__hotel-address-arrow">›</Text>
                            </View>
                        </View>
                    </View>

                    <View className="order-details__action-buttons">
                        <View className="order-details__action-btn">
                            <Text className="order-details__action-btn-icon">🗺️</Text>
                            <Text>导航/地图</Text>
                        </View>
                        <View className="order-details__action-btn">
                            <Text className="order-details__action-btn-icon">📞</Text>
                            <Text>联系酒店</Text>
                        </View>
                    </View>
                </View>

                {/* Booking Details Card */}
                <View className="order-details__card order-details__card--spaced">
                    <View className="order-details__detail-row">
                        <Text className="order-details__detail-icon">📅</Text>
                        <View className="order-details__detail-dates">
                            <Text className="order-details__detail-date">{formatDateWithWeek(order.check_in)}</Text>
                            <Text className="order-details__detail-nights">共{order.nights}晚</Text>
                            <Text className="order-details__detail-date">{formatDateWithWeek(order.check_out)}</Text>
                        </View>
                    </View>

                    <View className="order-details__detail-row order-details__detail-row--top">
                        <Text className="order-details__detail-icon order-details__detail-icon--top">🛏️</Text>
                        <View style={{ flex: 1 }}>
                            <View className="order-details__detail-room-row">
                                <Text className="order-details__detail-room-name">{order.room_name} 1间</Text>
                                <View className="order-details__detail-link">
                                    <Text>详情 </Text>
                                    <Text className="order-details__detail-link-arrow">›</Text>
                                </View>
                            </View>
                            <View className="order-details__detail-room-info">
                                <Text>凌晨特价</Text>
                                <Text>18-21m² | 1张2*1.5米床 | 外景窗</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Membership Benefits */}
                <View className="order-details__card order-details__card--gradient">
                    <View className="order-details__membership-header">
                        <Text className="order-details__membership-title">星会员专享</Text>
                        <Text className="order-details__membership-worth">额外享14项权益共值 ¥60</Text>
                    </View>
                    <View className="order-details__benefits-grid">
                        {[
                            { icon: '🏷️', label: '房费折扣', sub: '门市价9.8折', badge: undefined },
                            { icon: '🕒', label: '延迟退房', sub: '至12:00', badge: undefined },
                            { icon: '✨', label: '积分加倍', sub: '1倍积分', badge: '限本人' },
                            { icon: '📱', label: '在线选好房', sub: '移动端专享', badge: undefined }
                        ].map(item => (
                            <View key={item.label} className="order-details__benefit-item">
                                <View className="order-details__benefit-icon-wrapper">
                                    <Text className="order-details__benefit-icon">{item.icon}</Text>
                                    {item.badge && <Text className="order-details__benefit-badge">{item.badge}</Text>}
                                </View>
                                <Text className="order-details__benefit-label">{item.label}</Text>
                                <Text className="order-details__benefit-sub">{item.sub}</Text>
                            </View>
                        ))}
                    </View>
                    <View className="order-details__points-info">
                        <View className="order-details__points-row">
                            <Text className="order-details__points-label">本单积分 <Text className="order-details__points-info-icon">ℹ️</Text></Text>
                            <Text className="order-details__points-value-text">离店预计送 <Text className="order-details__points-highlight">278积分</Text>，以实际到账为准</Text>
                        </View>
                        <View className="order-details__points-row">
                            <Text className="order-details__points-label">间夜累计 <Text className="order-details__points-info-icon">ℹ️</Text></Text>
                            <Text className="order-details__points-value-text">离店预计送 <Text className="order-details__points-highlight">1间夜</Text>，以实际到账为准</Text>
                        </View>
                    </View>
                </View>

                {/* Order Info */}
                <View className="order-details__card order-details__card--spaced order-details__card--mb">
                    <Text className="order-details__order-info-title">订单信息</Text>
                    <View className="order-details__info-row">
                        <Text className="order-details__info-label">订单号</Text>
                        <View className="order-details__info-value">
                            <Text>9012333260212011624776006X05DEXD</Text>
                            <Text className="order-details__copy-icon">📄</Text>
                        </View>
                    </View>
                    <View className="order-details__info-row">
                        <Text className="order-details__info-label">联系方式</Text>
                        <Text className="order-details__info-value">18223597789</Text>
                    </View>
                    <View className="order-details__info-row">
                        <Text className="order-details__info-label">下单时间</Text>
                        <Text className="order-details__info-value">2026-02-12 01:16:25</Text>
                    </View>
                </View>

                {/* Spacer for bottom bar */}
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

                    {isPending && (
                        <View onClick={() => handleAction('cancel')} className="order-details__footer-btn order-details__footer-btn--outline">
                            <Text>取消订单</Text>
                        </View>
                    )}

                    <View onClick={() => handleAction('book_again')} className="order-details__footer-btn order-details__footer-btn--outline">
                        <Text>再次预订</Text>
                    </View>

                    {isPending && (
                        <View onClick={() => handleAction('pay')} className="order-details__footer-btn order-details__footer-btn--purple">
                            <Text>去支付</Text>
                        </View>
                    )}
                </View>
            </View>

        </View>
    );
};

export default OrderDetails;
