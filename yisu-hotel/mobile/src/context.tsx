import { createContext, useContext, useState } from 'react';
import { User, Order, Coupon } from '../types/types';
import { MOCK_USER, MOCK_ORDERS, COUPONS } from './constants';

interface AppContextType {
    user: User | null;
    login: (email: string) => void;
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
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
    const [coupons] = useState<Coupon[]>(COUPONS);

    const login = (email: string) => setUser({ ...MOCK_USER, email });
    const logout = () => setUser(null);
    const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
    const removeOrder = (id: string) => setOrders(prev => prev.filter(o => o.order_id !== id));

    return (
        <AppContext.Provider value={{ user, login, logout, orders, addOrder, removeOrder, coupons }}>
            {children}
        </AppContext.Provider>
    );
}
