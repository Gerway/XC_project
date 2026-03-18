import React, { useState, useMemo } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import { Order, OrderStatus } from '../../../types/types';
import { hotelApi } from '../../api/hotel';
import loadingGif from '../../images/loading.gif';
import './index.scss';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useDidShow(() => {
    const pages = Taro.getCurrentPages();
    setCanGoBack(pages.length > 1);
    setIsLoading(true);

    const userInfoStr = Taro.getStorageSync('userInfo');
    if (userInfoStr) {
      setIsLoggedIn(true);
      try {
        const userInfo = JSON.parse(userInfoStr);
        const userId = userInfo.user_id;
        if (userId) {
          hotelApi.getUserOrders({ user_id: userId }).then(res => {
            if (res?.data && Array.isArray(res.data)) {
              setOrders(res.data as Order[]);
            } else {
              setOrders([]);
            }
          }).catch(err => {
            console.error('Failed to fetch orders', err);
            setOrders([]);
          }).finally(() => setIsLoading(false));
        } else { setIsLoading(false); }
      } catch (e) {
        console.error('Failed to parse userInfo', e);
        setOrders([]);
        setIsLoading(false);
      }
    } else {
      setIsLoggedIn(false);
      setOrders([]);
      setIsLoading(false);
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
    hotelApi.deleteOrder({ order_id: orderId }).then(() => {
      setOrders(prev => prev.filter(o => o.order_id !== orderId));
      Taro.showToast({ title: '已删除', icon: 'none' });
    }).catch(() => {
      Taro.showToast({ title: '删除失败', icon: 'none' });
    });
  };

  const handleDelete = (orderId: string) => {
    Taro.showModal({
      title: '提示',
      content: '确认删除该订单吗?',
      success: (res) => {
        if (res.confirm) {
          removeOrder(orderId);
        }
      }
    });
  };

  const doCancelOrder = (orderId: string) => {
    hotelApi.cancelOrder({ order_id: orderId }).then(() => {
      // 更新本地状态：将该订单状态改为已取消
      setOrders(prev => prev.map(o =>
        o.order_id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o
      ));
      Taro.showToast({ title: '已取消', icon: 'none' });
    }).catch(() => {
      Taro.showToast({ title: '取消失败', icon: 'none' });
    });
  };

  const handleCancel = (order: Order) => {
    // 待支付订单直接取消
    if (order.status === OrderStatus.PENDING) {
      Taro.showModal({
        title: '提示',
        content: '确认取消该订单吗?',
        success: (res) => {
          if (res.confirm) doCancelOrder(order.order_id);
        }
      });
      return;
    }
    // 待入住订单需要判断 canCancel
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.CHECKED_IN) {
      if (!order.canCancel) {
        Taro.showToast({ title: '该订单不可取消', icon: 'none' });
        return;
      }
      Taro.showModal({
        title: '提示',
        content: '确认取消该订单吗?',
        success: (res) => {
          if (res.confirm) doCancelOrder(order.order_id);
        }
      });
    }
  };

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  const handleAction = async (action: string, order: Order) => {
    if (action === 'book_again') {
      Taro.navigateTo({ url: `/packageHotel/hotel-details/index?id=${order.hotel_id}` });
    } else if (action === 'pay') {
      Taro.navigateTo({ url: `/packageUser/order-details/index?orderId=${order.order_id}` });
    } else if (action === 'review') {
      Taro.navigateTo({ url: `/packageHotel/write-review/index?orderId=${order.order_id}` });
    }
  };

  const filteredOrders = useMemo(() => {
    if (!isLoggedIn) return [];
    switch (activeTab) {
      case 0: return orders;
      case 1: return orders.filter(o => o.status === OrderStatus.PENDING);
      case 2: return orders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.CHECKED_IN);
      case 3: return orders.filter(o => o.status === OrderStatus.COMPLETED);
      case 4: return orders.filter(o => o.status === OrderStatus.CANCELLED);
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
            </View>
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
        {isLoading ? (
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
            <Image src={loadingGif} style={{ width: '80px', height: '80px' }} />
            <Text style={{ color: '#999', fontSize: '13px', marginTop: '12px' }}>加载订单中...</Text>
          </View>
        ) : !isLoggedIn ? (
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
            const isPaid = order.status === OrderStatus.PAID || order.status === OrderStatus.CHECKED_IN;
            const isCancelled = order.status === OrderStatus.CANCELLED;
            const isCompleted = order.status === OrderStatus.COMPLETED;

            return (
              <View
                key={order.order_id}
                className="orders-page__card"
                onClick={() => Taro.navigateTo({ url: `/packageUser/order-details/index?orderId=${order.order_id}` })}
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
                    <Text>{order.room_name} <Text style={{ margin: '0 4px' }}>|</Text> {order.room_count || 1}间</Text>
                  </View>

                  <View className="orders-page__card-spacer"></View>

                  <View className="orders-page__card-price-row">
                    <Text className={`orders-page__card-currency ${isToPay ? 'orders-page__card-currency--red' : 'orders-page__card-currency--normal'}`}>¥</Text>
                    <Text className={`orders-page__card-price ${isToPay ? 'orders-page__card-price--red' : 'orders-page__card-price--normal'}`}>{order.real_pay.toFixed(2)}</Text>
                  </View>

                  <View className="orders-page__card-actions">
                    {/* 已完成 / 已取消 → 删除按钮 */}
                    {(isCancelled || isCompleted) && (
                      <View
                        onClick={(e) => { e.stopPropagation(); handleDelete(order.order_id); }}
                        className="orders-page__card-delete-btn"
                      >
                        <Text className="orders-page__card-delete-icon">🗑️</Text>
                      </View>
                    )}

                    {/* 待支付 / 待入住 → 取消订单按钮 */}
                    {(isToPay || isPaid) && (
                      <View
                        onClick={(e) => { e.stopPropagation(); handleCancel(order); }}
                        className="orders-page__card-btn orders-page__card-btn--outline"
                      >
                        <Text>取消订单</Text>
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
                        <Text>详情</Text>
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
