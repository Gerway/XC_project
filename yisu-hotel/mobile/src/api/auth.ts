import { request } from '../utils/request';

export const authApi = {
    /**
     * 用户登录
     * @param data 包含 account, password, role 等信息的对象
     */
    login(data: any) {
        return request({
            url: '/auth/login',
            method: 'POST',
            data
        });
    },

    /**
     * 用户注册
     * @param data 包含 username, password, email, role 等信息的对象
     */
    register(data: any) {
        return request({
            url: '/auth/register',
            method: 'POST',
            data
        });
    }
};
