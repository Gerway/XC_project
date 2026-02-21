import { request } from '../utils/request';
import { User } from '../../types/types';

export const userApi = {
    /**
     * 获取当前登录用户的个人信息
     */
    async getUserProfile() {
        // 后端在 /user/profile 接口会返回完整的 user 对象
        const user = await request<User>({
            url: '/user/profile',
            method: 'GET'
        });

        // 注册新用户时头像可能是 null，这里提供一个默认头像避免前端渲染报错
        if (!user.avatar) {
            user.avatar = `https://i.pravatar.cc/150?u=${user.user_id}`;
        }

        return user;
    }
};
