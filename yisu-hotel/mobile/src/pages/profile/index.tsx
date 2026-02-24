import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useAppContext } from '../../context';
import { hotelApi } from '../../api/hotel';
import './index.scss';

const Profile: React.FC = () => {
  const { user, logout: contextLogout } = useAppContext();
  const { statusBarHeight } = Taro.getSystemInfoSync();
  const [couponCount, setCouponCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

  const handleAuthAction = (action: () => void) => {
    if (!user) {
      Taro.navigateTo({ url: '/pages/login/index' });
    } else {
      action();
    }
  };

  const logout = () => {
    contextLogout();
    Taro.showToast({ title: '已退出登录', icon: 'none' });
  };

  useDidShow(() => {
    if (user) {
      // Fetch dynamic stats
      Promise.all([
        hotelApi.getUserCoupons({ user_id: user.user_id, status: 0 }),
        hotelApi.getFavorites({ user_id: user.user_id })
      ]).then(([couponsRes, favRes]) => {
        if (couponsRes) setCouponCount((couponsRes as any[]).length);
        if (favRes?.data) setFavCount(favRes.data.length);
      }).catch(err => {
        console.error('Failed to load profile stats:', err);
      });
    } else {
      setCouponCount(0);
      setFavCount(0);
    }
  });

  const points = user?.points ? Number(user.points) : 0;

  // Dynamic Membership Level logic based on user points
  const getMembershipInfo = () => {
    if (points < 10000) return { v: 'V1', name: '青铜会员 (Bronze)', gradient: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)' };
    if (points < 20000) return { v: 'V2', name: '白银会员 (Silver)', gradient: 'linear-gradient(135deg, #FFEDD5 0%, #F97316 100%)' };
    if (points < 30000) return { v: 'V3', name: '黄金会员 (Gold)', gradient: 'linear-gradient(135deg, #FEF08A 0%, #EA580C 100%)' };
    if (points < 40000) return { v: 'V4', name: '铂金会员 (Platinum)', gradient: 'linear-gradient(135deg, #FECACA 0%, #C2410C 100%)' };
    return { v: 'V5', name: '钻石会员 (Diamond)', gradient: 'linear-gradient(135deg, #475569 0%, #0F172A 100%)' };
  };

  const memberInfo = getMembershipInfo();

  const services = [
    { icon: 'https://api.iconify.design/lucide:user.svg?color=%23475569', label: '个人信息', path: '#' },
    { icon: 'https://api.iconify.design/lucide:wallet.svg?color=%23475569', label: '账户余额', path: '#' },
    { icon: 'https://api.iconify.design/lucide:shield-check.svg?color=%23475569', label: '实名认证', path: '#' },
    { icon: 'https://api.iconify.design/lucide:gift.svg?color=%23475569', label: '我的奖励', path: '#' },
    { icon: 'https://api.iconify.design/lucide:headphones.svg?color=%23475569', label: '联系客服', path: '#' },
    { icon: 'https://api.iconify.design/lucide:file-text.svg?color=%23475569', label: '协议规则', path: '#' },
    { icon: 'https://api.iconify.design/lucide:pen-tool.svg?color=%23475569', label: '意见反馈', path: '#' },
    { icon: 'https://api.iconify.design/lucide:users.svg?color=%23475569', label: '邀请好友', path: '#' },
  ];

  return (
    <ScrollView scrollY className="profile-page">
      {/* Header Area */}
      <View className="profile-page__header">
        <View style={{ height: `${statusBarHeight}px` }}></View>
        <View className="profile-page__header-content">
          <View className="profile-page__avatar-wrapper" onClick={() => !user && Taro.navigateTo({ url: '/pages/login/index' })}>
            <Image
              src={user?.avatar || "https://ui-avatars.com/api/?name=Guest&background=f3f4f6&color=9ca3af"}
              className="profile-page__avatar-img"
              mode="aspectFill"
            />
          </View>
          <View className="profile-page__user-info" onClick={() => !user && Taro.navigateTo({ url: '/pages/login/index' })}>
            {user ? (
              <View>
                <Text className="profile-page__username">{user.username}</Text>
                <Text className="profile-page__user-mobile">{user.phone || '138****0000'}</Text>
              </View>
            ) : (
              <Text className="profile-page__username">登录 / 注册</Text>
            )}
          </View>
          <View className="profile-page__header-actions">
            <Image src="https://api.iconify.design/lucide:settings.svg?color=%230f172a" style={{ width: 20, height: 20 }} />
            <Image src="https://api.iconify.design/lucide:message-square.svg?color=%230f172a" style={{ width: 20, height: 20, marginLeft: 16 }} />
          </View>
        </View>
      </View>

      {/* Member Card */}
      <View className="profile-page__card-container">
        <View className="profile-page__member-card" style={{ background: memberInfo.gradient }}>
          <View className="profile-page__member-info">
            <View className="profile-page__member-title-row" style={{ color: points >= 40000 ? '#FBBF24' : '#8B4500' }}>
              <Text className="profile-page__member-v">{memberInfo.v}</Text>
              <Text className="profile-page__member-level"> {memberInfo.name}</Text>
            </View>
            <Text className="profile-page__member-sub" style={{ color: points >= 40000 ? 'rgba(251, 191, 36, 0.7)' : 'rgba(139, 69, 0, 0.7)' }}>
              解锁专属特权 ›
            </Text>
          </View>
          <Image src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" className="profile-page__member-icon" />
        </View>
      </View>

      {/* Content Area */}
      <View className="profile-page__content">

        {/* Stats Row */}
        <View className="profile-page__stats-row">
          <View className="profile-page__stat-item" onClick={() => handleAuthAction(() => Taro.navigateTo({ url: '/pages/coupons/index' }))}>
            <Text className="profile-page__stat-value">{couponCount}</Text>
            <Text className="profile-page__stat-label">优惠券</Text>
          </View>
          <View className="profile-page__stat-line"></View>
          <View className="profile-page__stat-item" onClick={() => handleAuthAction(() => Taro.navigateTo({ url: '/pages/favorites/index' }))}>
            <Text className="profile-page__stat-value">{favCount}</Text>
            <Text className="profile-page__stat-label">收藏/足迹</Text>
          </View>
          <View className="profile-page__stat-line"></View>
          <View className="profile-page__stat-item">
            <Text className="profile-page__stat-value">{points}</Text>
            <Text className="profile-page__stat-label">里程积分</Text>
          </View>
        </View>

        {/* Orders Row */}
        <View className="profile-page__section-card">
          <View className="profile-page__icon-row">
            {[
              { label: '全部订单', icon: 'https://api.iconify.design/lucide:receipt.svg?color=%23475569' },
              { label: '待付款', icon: 'https://api.iconify.design/lucide:credit-card.svg?color=%23475569' },
              { label: '待出行', icon: 'https://api.iconify.design/lucide:briefcase.svg?color=%23475569' },
              { label: '退款/售后', icon: 'https://api.iconify.design/lucide:banknote.svg?color=%23475569' }
            ].map((item, idx) => (
              <View
                key={idx}
                className="profile-page__icon-item"
                onClick={() => handleAuthAction(() => Taro.switchTab({ url: '/pages/orders/index' }))}
              >
                <Image src={item.icon} className="profile-page__icon-img" />
                <Text className="profile-page__icon-label">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Services Grid */}
        <View className="profile-page__section-card">
          <View className="profile-page__grid">
            {services.map((item, idx) => (
              <View
                key={idx}
                className="profile-page__grid-item"
                onClick={() => handleAuthAction(() => Taro.showToast({ title: '敬请期待', icon: 'none' }))}
              >
                <Image src={item.icon} className="profile-page__grid-icon" />
                <Text className="profile-page__grid-label">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {user && (
          <Button className="profile-page__logout-btn" onClick={logout}>退出登录</Button>
        )}

        <View style={{ height: '40px' }}></View>
      </View>
    </ScrollView>
  );
};

export default Profile;
