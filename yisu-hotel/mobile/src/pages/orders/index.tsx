import React, { useState, useMemo } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import { Order, OrderStatus } from '../../../types/types';
import './index.scss';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useDidShow(() => {
    // Check page stack depth
    const pages = Taro.getCurrentPages();
    setCanGoBack(pages.length > 1);

    // Check Login Status
    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo) {
      setIsLoggedIn(true);
      // Load orders
      try {
        const raw = Taro.getStorageSync('orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } else {
          setOrders([]);
        }
      } catch (e) {
        console.error('Failed to load orders', e);
        setOrders([]);
      }
    } else {
      setIsLoggedIn(false);
      setOrders([]);
    }
  });

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const format = (d: Date) => `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
    return `${format(start)}-${format(end)}`;
  };

  const getStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return { text: '待支付', mod: 'pending' };
      case OrderStatus.PAID: return { text: '待入住', mod: 'paid' };
      case OrderStatus.CHECKED_IN: return { text: '入住中', mod: 'checked-in' };
      case OrderStatus.COMPLETED: return { text: '已完成', mod: 'completed' };
      case OrderStatus.CANCELLED: return { text: '已取消', mod: 'cancelled' };
      default: return { text: '', mod: '' };
    }
  };

  const removeOrder = (orderId: string) => {
    const newOrders = orders.filter(o => o.order_id !== orderId);
    setOrders(newOrders);
    Taro.setStorageSync('orders', JSON.stringify(newOrders));
  };

  const handleDelete = (orderId: string) => {
    Taro.showModal({
      title: '提示',
      content: '确认删除该订单吗?',
      success: (res) => {
        if (res.confirm) {
          removeOrder(orderId);
          Taro.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  };

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  const handleAction = (action: string, order: Order) => {
    if (action === 'book_again') {
      // Check if hotel exists in constant? For now simplify to navigate to details
      Taro.navigateTo({ url: `/pages/hotel-details/index?id=${order.hotel_id}` });
    } else if (action === 'pay') {
      Taro.navigateTo({ url: `/pages/booking/index?orderId=${order.order_id}` });
    } else if (action === 'review') {
      Taro.navigateTo({ url: `/pages/reviews/index?orderId=${order.order_id}` });
    }
  };

  const filteredOrders = useMemo(() => {
    if (!isLoggedIn) return [];
    switch (activeTab) {
      case 0: return orders; // All
      case 1: return orders.filter(o => o.status === OrderStatus.PENDING); // To Pay
      case 2: return orders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.CHECKED_IN); // To Check-in (Paid or Checked-in)
      case 3: return orders.filter(o => o.status === OrderStatus.COMPLETED); // To Review (Completed)
      case 4: return orders.filter(o => o.status === OrderStatus.CANCELLED); // Cancelled
      default: return orders;
    }
  }, [activeTab, orders, isLoggedIn]);

  const tabs = [
    { id: 0, label: '全部' },
    { id: 1, label: '待支付' },
    { id: 2, label: '待入住' },
    { id: 3, label: '待评价' },
    { id: 4, label: '取消' },
  ];

  const { statusBarHeight } = Taro.getSystemInfoSync();

  return (
    <View className="orders-page">
      <View className="orders-page__header">
        {/* Status bar spacer */}
        <View style={{ height: `${statusBarHeight}px` }}></View>

        <View className="orders-page__header-inner">
          <View
            onClick={() => canGoBack ? Taro.navigateBack() : Taro.switchTab({ url: '/pages/home/index' })}
            className="orders-page__back-btn"
            style={{ opacity: canGoBack ? 1 : 0, pointerEvents: canGoBack ? 'auto' : 'none' }}
          >
            <Text className="orders-page__back-icon">‹</Text>
          </View>

          <View className="orders-page__title-center">
            <View className="orders-page__title-row">
              <Text className="orders-page__title">酒店订单</Text>
              <Text className="orders-page__title-expand">▾</Text>
            </View>
          </View>

          <View className="orders-page__header-actions">
            <Text className="orders-page__header-action-icon">🔍</Text>
            <Text className="orders-page__header-action-icon">⋮</Text>
          </View>
        </View>

        <View className="orders-page__tabs">
          {tabs.map(tab => (
            <View
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="orders-page__tab"
            >
              <Text className={`orders-page__tab-text ${activeTab === tab.id ? 'orders-page__tab-text--active' : ''}`}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View className="orders-page__tab-indicator"></View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className="orders-page__sort-bar" style={{ marginTop: `${(statusBarHeight || 44) + 44 + 44}px` }}>
        {/* Header height: StatusBar + 44px (header inner) + 44px (tabs) approx? 
                 Actually let's inspect styling. Header is sticky. 
                 We need to pad the top of the ScrollView or Main content, not sort bar if sort bar follows header normal flow?
                 In Taro/mini-program `sticky` works well.
             */}
        <View className="orders-page__sort-btn">
          <Text>按预订时间排序</Text>
        </View>
        <View className="orders-page__sort-btn orders-page__sort-btn--active">
          <Text>按入住时间排序</Text>
        </View>
      </View>
      {/* Order List */}
      <ScrollView scrollY className="orders-page__list">
        {!isLoggedIn ? (
          <View className="orders-page__empty">
            <Text className="orders-page__empty-icon">🧾</Text>
            <Text className="orders-page__empty-text">您还没有订单哟~</Text>
            <View className="orders-page__login-btn" onClick={handleLogin}>
              <Text>登录</Text>
            </View>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="orders-page__empty">
            <Text className="orders-page__empty-icon">🧾</Text>
            <Text className="orders-page__empty-text">您还没有订单哟~</Text>
            <View className="orders-page__empty-btn" onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
              <Text>预订</Text>
            </View>
          </View>
        ) : (
          filteredOrders.map(order => {
            const statusMeta = getStatusDisplay(order.status);
            const isToPay = order.status === OrderStatus.PENDING;
            const isCancelled = order.status === OrderStatus.CANCELLED;
            const isCompleted = order.status === OrderStatus.COMPLETED;

            return (
              <View
                key={order.order_id}
                className="orders-page__card"
                onClick={() => Taro.navigateTo({ url: `/pages/order-details/index?orderId=${order.order_id}` })}
              >
                <View className="orders-page__card-image">
                  <Image
                    src={order.hotel_image}
                    mode="aspectFill"
                    className="orders-page__card-img"
                  />
                  {isCancelled && <View className="orders-page__card-cancelled-overlay"></View>}
                </View>

                <View className="orders-page__card-content">
                  <View className="orders-page__card-title-row">
                    <Text className="orders-page__card-hotel-name">{order.hotel_name}</Text>
                    <Text className={`orders-page__card-status orders-page__card-status--${statusMeta.mod}`}>
                      {statusMeta.text}
                    </Text>
                  </View>

                  <View className="orders-page__card-dates">
                    <Text>{formatDateRange(order.check_in, order.check_out)} <Text style={{ margin: '0 4px' }}>共{order.nights}晚</Text></Text>
                  </View>
                  <View className="orders-page__card-room">
                    <Text>{order.room_name} <Text style={{ margin: '0 4px' }}>|</Text> 1间</Text>
                  </View>

                  <View className="orders-page__card-spacer"></View>

                  <View className="orders-page__card-price-row">
                    <Text className={`orders-page__card-currency ${isToPay ? 'orders-page__card-currency--red' : 'orders-page__card-currency--normal'}`}>¥</Text>
                    <Text className={`orders-page__card-price ${isToPay ? 'orders-page__card-price--red' : 'orders-page__card-price--normal'}`}>{order.real_pay.toFixed(2)}</Text>
                  </View>

                  <View className="orders-page__card-actions">
                    {(isCancelled || isCompleted) && (
                      <View
                        onClick={(e) => { e.stopPropagation(); handleDelete(order.order_id); }}
                        className="orders-page__card-delete-btn"
                      >
                        <Text className="orders-page__card-delete-icon">🗑️</Text>
                      </View>
                    )}

                    <View
                      onClick={(e) => { e.stopPropagation(); handleAction('book_again', order); }}
                      className="orders-page__card-btn orders-page__card-btn--outline"
                    >
                      <Text>再次预订</Text>
                    </View>

                    {isToPay && (
                      <View
                        onClick={(e) => { e.stopPropagation(); handleAction('pay', order); }}
                        className="orders-page__card-btn orders-page__card-btn--primary"
                      >
                        <Text>去支付</Text>
                      </View>
                    )}
                    {isCompleted && (
                      <View
                        onClick={(e) => { e.stopPropagation(); handleAction('review', order); }}
                        className="orders-page__card-btn orders-page__card-btn--outline"
                      >
                        <Text>去评价</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Bottom spacer for safe area */}
        <View style={{ height: '40px' }}></View>
      </ScrollView>
    </View>
  );
};

export default Orders;
