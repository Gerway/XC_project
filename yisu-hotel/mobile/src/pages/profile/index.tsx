import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { MOCK_USER } from '../../constants';
import { User } from '../../../types/types';
import './index.scss';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const { statusBarHeight } = Taro.getSystemInfoSync();

  const handleAuthAction = (action: () => void) => {
    if (!user) {
      Taro.navigateTo({ url: '/pages/login/index' });
    } else {
      action();
    }
  };

  const logout = () => {
    setUser(null);
    Taro.showToast({ title: 'Logged out', icon: 'none' });
  };

  const menuItems = [
    { icon: '♥', label: 'My Favorites', sub: '12 saved hotels', path: '/pages/favorites/index', colorMod: 'pink', badge: false },
    { icon: '🕒', label: 'Browsing History', sub: 'View recently viewed', path: '#', colorMod: 'amber', badge: false },
    { icon: '🎟', label: 'Coupons', sub: '2 active coupons', path: '/pages/coupons/index', colorMod: 'orange', badge: true },
    { icon: '⚙', label: 'Settings', sub: 'Preferences & Privacy', path: '#', colorMod: 'slate', badge: false },
  ];

  return (
    <ScrollView scrollY className="profile-page">
      <View className="profile-page__header">
        {/* Status bar spacer */}
        <View style={{ height: `${statusBarHeight}px` }}></View>

        <View className="profile-page__decor-blob profile-page__decor-blob--orange"></View>
        <View className="profile-page__decor-blob profile-page__decor-blob--blue"></View>

        <View className="profile-page__top-bar">
          <Text className="profile-page__page-title">Profile</Text>
          <View className="profile-page__notification-btn">
            <Text className="profile-page__notification-icon">🔔</Text>
          </View>
        </View>

        <View className="profile-page__user-info">
          <View className="profile-page__avatar-wrapper" onClick={() => !user && Taro.navigateTo({ url: '/pages/login/index' })}>
            <View className="profile-page__avatar-ring">
              <Image
                src={user?.avatar || "https://ui-avatars.com/api/?name=Guest&background=f3f4f6&color=9ca3af"}
                className="profile-page__avatar-img"
                mode="aspectFill"
              />
            </View>
            {user && (
              <View className="profile-page__edit-btn">
                <Text className="profile-page__edit-icon">✎</Text>
              </View>
            )}
          </View>

          <View className="profile-page__name-area">
            <Text
              className="profile-page__username"
              onClick={() => !user && Taro.navigateTo({ url: '/pages/login/index' })}
            >
              {user ? user.username : 'Log In / Sign Up'}
            </Text>

            {user ? (
              <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', marginBottom: '4px' }}>
                  <Text className="profile-page__membership-badge">Gold Member</Text>
                </View>
                <Text className="profile-page__email">{user.email}</Text>
              </View>
            ) : (
              <Text className="profile-page__guest-hint">Unlock exclusive deals</Text>
            )}
          </View>
        </View>
      </View>

      <View className="profile-page__content">
        {/* Points Card */}
        <View
          className="profile-page__points-card"
          onClick={() => handleAuthAction(() => { })}
        >
          <View className="profile-page__points-decor-stripe"></View>
          <View className="profile-page__points-decor-circle"></View>

          <View className="profile-page__points-inner">
            <View>
              <Text className="profile-page__points-label">Loyalty Points</Text>
              <View style={{ display: 'flex', alignItems: 'baseline' }}>
                <Text className="profile-page__points-value">{user ? user.points.toLocaleString() : '0'} </Text>
                <Text className="profile-page__points-unit">pts</Text>
              </View>
              <Text className="profile-page__points-tier-text">{user ? "You're 550 pts away from Platinum" : "Join now to earn rewards"}</Text>
            </View>
            <View className="profile-page__points-action-btn">
              <Text>View Benefits</Text>
            </View>
          </View>
        </View>

        {/* Orders Shortcut */}
        <View>
          <View
            className="profile-page__orders-header"
            onClick={() => handleAuthAction(() => Taro.switchTab({ url: '/pages/orders/index' }))}
          >
            <Text className="profile-page__orders-title">My Orders</Text>
            <View className="profile-page__orders-link">
              <Text>View All </Text>
              <Text className="profile-page__orders-link-icon">›</Text>
            </View>
          </View>

          <View className="profile-page__orders-grid">
            {[
              { label: 'To Pay', icon: '💳', badge: 1 },
              { label: 'Upcoming', icon: '🧳', badge: 0 },
              { label: 'Completed', icon: '✅', badge: 0 },
              { label: 'Canceled', icon: '🚫', badge: 0 }
            ].map(item => (
              <View
                key={item.label}
                className="profile-page__order-item"
                onClick={() => handleAuthAction(() => Taro.switchTab({ url: '/pages/orders/index' }))}
              >
                <View className="profile-page__order-icon-wrapper">
                  <Text className="profile-page__order-icon">{item.icon}</Text>
                  {user && item.badge > 0 && (
                    <View className="profile-page__order-badge">
                      <Text>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text className="profile-page__order-label">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View>
          <Text className="profile-page__menu-title">Account</Text>
          <View className="profile-page__menu-card">
            {menuItems.map((item, idx) => (
              <View
                key={item.label}
                onClick={() => handleAuthAction(() => Taro.showToast({ title: 'Feature coming soon', icon: 'none' }))}
                className={`profile-page__menu-item ${idx !== menuItems.length - 1 ? 'profile-page__menu-item--bordered' : ''}`}
              >
                <View className="profile-page__menu-item-left">
                  <View className={`profile-page__menu-icon-wrapper profile-page__menu-icon-wrapper--${item.colorMod}`}>
                    <Text className="profile-page__menu-icon">{item.icon}</Text>
                  </View>
                  <View>
                    <View className="profile-page__menu-label">
                      <Text>{item.label}</Text>
                      {user && item.badge && (
                        <View className="profile-page__menu-badge-dot"></View>
                      )}
                    </View>
                    <Text className="profile-page__menu-sub">{item.sub}</Text>
                  </View>
                </View>
                <Text className="profile-page__menu-arrow">›</Text>
              </View>
            ))}
          </View>
        </View>

        {user && (
          <View
            onClick={logout}
            className="profile-page__logout-btn"
          >
            <Text>Log Out</Text>
          </View>
        )}

        <View className="profile-page__spacer"></View>
        {/* Bottom spacer for tabbar */}
        <View style={{ height: '80px' }}></View>
      </View>
    </ScrollView>
  );
};

export default Profile;
