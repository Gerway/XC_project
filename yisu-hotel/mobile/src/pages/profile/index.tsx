import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { MOCK_USER } from '../../constants';
import { User } from '../../../types/types';
import './index.scss';

const Profile: React.FC = () => {
  // Use mock user state
  // Use mock user state
  const [user, setUser] = useState<User | null>(null);
  const { statusBarHeight } = Taro.getSystemInfoSync();

  Taro.useDidShow(() => {
    const stored = Taro.getStorageSync('userInfo');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    } else {
      // If no stored user, checking MOCK_USER for default dev state, or keep null
      // For this flow, we start null if nothing in storage (User expects "Not Logged In" if they haven't logged in)
      setUser(null);
    }
  });

  const handleAuthAction = (action: () => void) => {
    if (!user) {
      Taro.navigateTo({ url: '/pages/login/index' });
    } else {
      action();
    }
  };

  const logout = () => {
    setUser(null);
    Taro.removeStorageSync('userInfo');
    Taro.showToast({ title: 'Logged out', icon: 'none' });
  };

  const services = [
    { icon: '📋', label: 'My Info', path: '#' },
    { icon: '💰', label: 'Balance', path: '#' },
    { icon: '🛡', label: 'Identity', path: '#' },
    { icon: '🎁', label: 'Rewards', path: '#' },
    { icon: '🎧', label: 'Service', path: '#' },
    { icon: '📝', label: 'Agreements', path: '#' },
    { icon: '✍', label: 'Feedback', path: '#' },
    { icon: '👋', label: 'Invite', path: '#' },
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
              <Text className="profile-page__username">Log In / Sign Up</Text>
            )}
          </View>
          <View className="profile-page__header-actions">
            <Text className="profile-page__header-icon">⚙</Text>
            <Text className="profile-page__header-icon">💬</Text>
          </View>
        </View>
      </View>

      {/* Member Card */}
      <View className="profile-page__card-container">
        <View className="profile-page__member-card">
          <View className="profile-page__member-info">
            <View className="profile-page__member-title-row">
              <Text className="profile-page__member-v">V1</Text>
              <Text className="profile-page__member-level"> Gold Member</Text>
            </View>
            <Text className="profile-page__member-sub">Exclusive deals unlocked ›</Text>
          </View>
          <Image src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" className="profile-page__member-icon" />
        </View>
      </View>

      {/* Content Area */}
      <View className="profile-page__content">

        {/* Stats Row */}
        <View className="profile-page__stats-row">
          <View className="profile-page__stat-item">
            <Text className="profile-page__stat-value">2</Text>
            <Text className="profile-page__stat-label">Coupons</Text>
          </View>
          <View className="profile-page__stat-line"></View>
          <View className="profile-page__stat-item">
            <Text className="profile-page__stat-value">12</Text>
            <Text className="profile-page__stat-label">Favorites</Text>
          </View>
          <View className="profile-page__stat-line"></View>
          <View className="profile-page__stat-item">
            <Text className="profile-page__stat-value">{user?.points || 0}</Text>
            <Text className="profile-page__stat-label">Points</Text>
          </View>
        </View>

        {/* Orders Row */}
        <View className="profile-page__section-card">
          {/* <View className="profile-page__section-header">
               <Text className="profile-page__section-title">My Orders</Text>
            </View> */}
          <View className="profile-page__icon-row">
            {[
              { label: 'My Orders', icon: '🧾' },
              { label: 'To Pay', icon: '💳' },
              { label: 'Upcoming', icon: '🧳' },
              { label: 'Refunds', icon: '💰' }
            ].map((item, idx) => (
              <View
                key={idx}
                className="profile-page__icon-item"
                onClick={() => handleAuthAction(() => Taro.switchTab({ url: '/pages/orders/index' }))}
              >
                <Text className="profile-page__icon-img">{item.icon}</Text>
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
                onClick={() => handleAuthAction(() => Taro.showToast({ title: 'Coming soon', icon: 'none' }))}
              >
                <Text className="profile-page__grid-icon">{item.icon}</Text>
                <Text className="profile-page__grid-label">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {user && (
          <Button className="profile-page__logout-btn" onClick={logout}>Log Out</Button>
        )}

        <View style={{ height: '40px' }}></View>
      </View>
    </ScrollView>
  );
};

export default Profile;
