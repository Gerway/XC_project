import React, { useState } from 'react';
import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { MOCK_USER } from '../../constants';
import './index.scss';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const { statusBarHeight } = Taro.getSystemInfoSync();

    const handleSubmit = () => {
        // Mock Login Logic
        if (email && password) {
            Taro.showLoading({ title: '登录中...' });
            setTimeout(() => {
                Taro.hideLoading();
                // Save mock user
                Taro.setStorageSync('userInfo', JSON.stringify({ ...MOCK_USER, email }));
                // Redirect to Home (Tab Bar page)
                Taro.switchTab({ url: '/pages/home/index' });
            }, 1000);
        } else {
            Taro.showToast({ title: 'Please fill all fields', icon: 'none' });
        }
    };

    const handleBack = () => {
        const pages = Taro.getCurrentPages();
        if (pages.length > 1) {
            Taro.navigateBack();
        } else {
            Taro.switchTab({ url: '/pages/home/index' });
        }
    };

    return (
        <View className="login-page">
            <View className="login-page__hero">
                <View className="login-page__hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop)' }}></View>
                <View className="login-page__hero-overlay"></View>
                <View className="login-page__hero-text">
                    <Text className="login-page__hero-title">{isRegister ? 'Join YiSu' : 'Welcome Back'}</Text>
                    <Text className="login-page__hero-subtitle">Unlock exclusive deals and manage your bookings.</Text>
                </View>
                <View onClick={handleBack} className="login-page__back-btn" style={{ top: `${(statusBarHeight || 20) + 12}px` }}>
                    <Text className="login-page__back-icon">‹</Text>
                </View>
            </View>

            <View className="login-page__form-area">
                <View className="login-page__toggle">
                    <View onClick={() => setIsRegister(false)} className={`login-page__toggle-btn ${!isRegister ? 'login-page__toggle-btn--active' : ''}`}>
                        <Text>Log In</Text>
                    </View>
                    <View onClick={() => setIsRegister(true)} className={`login-page__toggle-btn ${isRegister ? 'login-page__toggle-btn--active' : ''}`}>
                        <Text>Register</Text>
                    </View>
                </View>

                <View className="login-page__form">
                    {isRegister && (
                        <View>
                            <Text className="login-page__field-label">Username</Text>
                            <Input type="text" className="login-page__field-input" placeholder="Choose a username" />
                        </View>
                    )}
                    <View>
                        <Text className="login-page__field-label">Email Address</Text>
                        <Input type="text" value={email} onInput={e => setEmail(e.detail.value)} className="login-page__field-input" placeholder="name@example.com" />
                    </View>
                    <View>
                        <Text className="login-page__field-label">Password</Text>
                        <Input type="safe-password" password value={password} onInput={e => setPassword(e.detail.value)} className="login-page__field-input" placeholder="••••••••" />
                    </View>

                    <Button onClick={handleSubmit} className="login-page__submit-btn">
                        {isRegister ? 'Create Account' : 'Log In'}
                    </Button>
                </View>

                <View className="login-page__footer">
                    <Text className="login-page__footer-text">By continuing, you agree to our Terms & Privacy Policy.</Text>
                </View>
            </View>
        </View>
    );
};

export default Login;
