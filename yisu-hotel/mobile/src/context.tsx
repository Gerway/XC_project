import { createContext, useContext, useState } from 'react';
import Taro from '@tarojs/taro';
import { User } from '../types/types';

interface AppContextType {
    user: User | null;
    login: (userInfo: User) => void;
    logout: () => void;
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

    const login = (userInfo: User) => {
        setUser(userInfo);
        Taro.setStorageSync('userInfo', JSON.stringify(userInfo));
    };
    const logout = () => {
        setUser(null);
        Taro.removeStorageSync('token');
        Taro.removeStorageSync('userInfo');
    };

    return (
        <AppContext.Provider value={{ user, login, logout }}>
            {children}
        </AppContext.Provider>
    );
}
