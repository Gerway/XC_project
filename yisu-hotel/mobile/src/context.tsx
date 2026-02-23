import { createContext, useContext, useState } from 'react';
import Taro from '@tarojs/taro';
import { User, Order, Coupon } from '../types/types';
import { COUPONS } from './constants';

interface AppContextType {
    user: User | null;
    login: (userInfo: User) => void;
    logout: () => void;
    orders: Order[];
    addOrder: (order: Order) => void;
    removeOrder: (orderId: string) => void;
    coupons: Coupon[];
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be inside AppProvider');
    return ctx;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const stored = Taro.getStorageSync('userInfo');
        return stored ? JSON.parse(stored) : null;
    });
    const [orders, setOrders] = useState<Order[]>([]);
    const [coupons] = useState<Coupon[]>(COUPONS);

    const login = (userInfo: User) => {
        setUser(userInfo);
        Taro.setStorageSync('userInfo', JSON.stringify(userInfo));
    };
    const logout = () => {
        setUser(null);
        Taro.removeStorageSync('token');
        Taro.removeStorageSync('userInfo');
    };
    const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
    const removeOrder = (id: string) => setOrders(prev => prev.filter(o => o.order_id !== id));

    return (
        <AppContext.Provider value={{ user, login, logout, orders, addOrder, removeOrder, coupons }}>
            {children}
        </AppContext.Provider>
    );
}
