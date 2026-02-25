import Taro from '@tarojs/taro';

// 后端 API 基础地址
const BASE_URL = 'https://yisuhotel.onrender.com/api';

/**
 * 封装的全局请求工具
 * @param options Taro.request 的配置参数
 * @returns Promise
 */
export const request = async <T = any>(options: Taro.request.Option): Promise<T> => {
    // 1. 尝试从本地缓存中获取登录凭证
    const token = Taro.getStorageSync('token');

    // 2. 组装请求头
    const header: Record<string, any> = {
        'Content-Type': 'application/json',
        ...options.header,
    };

    // 如果存在 Token，按要求带上 Bearer 前缀并放到 Authorization 请求头中
    if (token) {
        header['Authorization'] = `Bearer ${token}`;
    }

    try {
        // 3. 发起请求
        const res = await Taro.request({
            ...options,
            url: BASE_URL + options.url.replace(/^\/?/, '/'), // 确保以 / 开头
            header,
        });

        const statusCode = res.statusCode;

        // 4. 根据 HTTP 状态码处理响应
        if (statusCode >= 200 && statusCode < 300) {
            // 请求成功，直接返回数据部分
            return res.data as T;
        } else if (statusCode === 401 || statusCode === 403) {
            // 如果是登录或注册接口返回的401/403，说明是账号密码错误，直接把错误抛给调用方处理，不作全局提示和重定向
            if (options.url.includes('/login') || options.url.includes('/register')) {
                return Promise.reject(res.data);
            }

            // 其他需要登录的接口报错，清空 token 并跳转登录页
            Taro.showToast({
                title: res.data?.message || '登录已过期，请重新登录',
                icon: 'none',
                duration: 2000
            });
            // 清除本地失效 token，防止死循环
            Taro.removeStorageSync('token');
            Taro.removeStorageSync('userInfo');

            // 重定向跳转回登录页
            Taro.reLaunch({ url: '/pages/login/index' });
            return Promise.reject(res.data);
        } else {
            // 其他后端业务错误 (例如 404, 409, 500 等)
            // 你可以选择在这里全局 Toast 提示，或者让具体的页面自己处理
            return Promise.reject(res.data);
        }
    } catch (error) {
        // 网络不通、超时等底层报错
        Taro.showToast({ title: '网络请求报错，请检查网络设定', icon: 'error' });
        return Promise.reject(error);
    }
};
