import React, { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { authApi } from '../../api/auth';
import { userApi } from '../../api/user';
import { useAppContext } from '../../context';
import './index.scss';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const { statusBarHeight } = Taro.getSystemInfoSync();
    const { login } = useAppContext();

    const handleSubmit = async () => {
        if (!email || !password || (isRegister && !username)) {
            Taro.showToast({ title: '请填写所有必填项', icon: 'none' });
            return;
        }

        Taro.showLoading({ title: isRegister ? '注册中...' : '登录中...' });
        try {
            if (isRegister) {
                const res = await authApi.register({
                    username,
                    email,
                    password,
                    role: '用户'
                });
                Taro.setStorageSync('token', res.token);
            } else {
                const res = await authApi.login({
                    account: email,
                    password,
                    role: '用户',
                    remember: true
                });
                Taro.setStorageSync('token', res.token);
            }

            // 获取真正的用户信息
            const userInfo = await userApi.getUserProfile();
            userInfo.isLoggedIn = true; // 附加前端标识

            // 全局状态保存真正的 User
            login(userInfo);

            Taro.hideLoading();
            setTimeout(() => {
                Taro.showToast({ title: '登录成功', icon: 'success' });
            }, 100);

            // Redirect to Home
            setTimeout(() => {
                Taro.switchTab({ url: '/pages/home/index' });
            }, 1000);
        } catch (error: any) {
            Taro.hideLoading();
            setTimeout(() => {
                Taro.showToast({
                    title: error?.message || (isRegister ? '注册失败' : '登录失败'),
                    icon: 'none',
                    duration: 2000
                });
            }, 100);
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
                    <Text className="login-page__hero-title">{isRegister ? '加入易宿' : '欢迎回来'}</Text>
                    <Text className="login-page__hero-subtitle">解锁专属优惠，轻松管理您的预订。</Text>
                </View>
                <View onClick={handleBack} className="login-page__back-btn" style={{ top: `${(statusBarHeight || 20) + 12}px` }}>
                    <Text className="login-page__back-icon">‹</Text>
                </View>
            </View>

            <View className="login-page__form-area">
                <View className="login-page__toggle">
                    <View onClick={() => setIsRegister(false)} className={`login-page__toggle-btn ${!isRegister ? 'login-page__toggle-btn--active' : ''}`}>
                        <Text>登录</Text>
                    </View>
                    <View onClick={() => setIsRegister(true)} className={`login-page__toggle-btn ${isRegister ? 'login-page__toggle-btn--active' : ''}`}>
                        <Text>注册</Text>
                    </View>
                </View>

                <View className="login-page__form">
                    {isRegister && (
                        <View>
                            <Text className="login-page__field-label">用户名</Text>
                            <Input type="text" value={username} onInput={e => setUsername(e.detail.value)} className="login-page__field-input" placeholder="请设置用户名" />
                        </View>
                    )}
                    <View>
                        <Text className="login-page__field-label">用户名或邮箱地址</Text>
                        <Input type="text" value={email} onInput={e => setEmail(e.detail.value)} className="login-page__field-input" placeholder="请输入您的用户名或邮箱地址" />
                    </View>
                    <View>
                        <Text className="login-page__field-label">登录密码</Text>
                        <Input type="safe-password" password value={password} onInput={e => setPassword(e.detail.value)} className="login-page__field-input" placeholder="••••••••" />
                    </View>

                    <Button onClick={handleSubmit} className="login-page__submit-btn">
                        {isRegister ? '第一次见到你' : '登录'}
                    </Button>
                </View>

                <View className="login-page__footer">
                    <Text className="login-page__footer-text">继续即表示同意易宿的《用户条款》和《隐私政策》。</Text>
                </View>
            </View>
        </View>
    );
};

export default Login;
