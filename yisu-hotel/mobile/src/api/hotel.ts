import { request } from '../utils/request';

export interface Hotel {
    hotel_id: string;
    name: string;
    address: string;
    city_name: string;
    latitude: number;
    longitude: number;
    star_rating: number;
    tags: string;
    description: string;
    hotel_type: number;
    score: number;
    reviews: number;
    min_price: number;
    image_url?: string;
    real_reviews_count?: number;
    original_price?: number;
    left_stock?: number;
    remark?: string;
    open_time?: string;
}

export interface SearchHotelsParams {
    keyword?: string;
    city_name?: string;
    check_in?: string; // YYYY-MM-DD
    check_out?: string; // YYYY-MM-DD
    min_price?: number;
    max_price?: number;
    star_rating?: number[]; // [4, 5]
    room_type?: number;
}

export interface HotelDetailsBody {
    hotel_id: string;
    check_in?: string;
    check_out?: string;
}

export interface RoomDetails {
    room_id: string;
    name: string;
    area: number;
    has_breakfast: number;
    has_window: number;
    room_bed: string;
    ori_price: number;
    avg_price: number;
    image_url?: string;
}

export interface Review {
    content: string;
    score: number;
    created_at: string;
    images?: any;
    tags?: string[];
    username?: string;
}

export interface HotelDetails extends Omit<Hotel, 'reviews'> {
    ranking: {
        city_rank: number;
        total_rank: number;
    };
    media: Array<{ url: string; media_type: number; media_name: string }>;
    rooms: RoomDetails[];
    reviews_count: number;
    reviews: Review[];
    review_keywords: string[];
}

export interface DailyInventory {
    date: string;   // YYYY-MM-DD
    price: number;
    stock: number;
}

export const hotelApi = {
    /**
     * 搜索酒店列表
     */
    searchHotels(data: SearchHotelsParams) {
        return request<{ message: string; data: Hotel[] }>({
            url: '/hotel/search',
            method: 'POST',
            data
        });
    },

    /**
     * 获取酒店详情
     */
    getHotelDetails(data: HotelDetailsBody) {
        return request<{ message: string; data: HotelDetails }>({
            url: '/hotel/details',
            method: 'POST',
            data
        });
    },

    /**
     * 获取房型逐日价格与库存
     */
    getRoomInventory(data: { room_id: string; check_in: string; check_out: string }) {
        return request<{ message: string; data: { daily: DailyInventory[]; min_stock: number } }>({
            url: '/hotel/room-inventory',
            method: 'POST',
            data
        });
    },

    /**
     * 进入预定页时创建未支付订单
     */
    createOrder(data: {
        user_id: string; hotel_id: string; room_id: string;
        check_in: string; check_out: string; nights: number; room_count: number;
        total_price: number; real_pay: number; can_cancel: number; special_request?: string;
        daily: { date: string; price: number; breakfast_count: number }[];
    }) {
        return request<{ message: string; data: { order_id: string } }>({
            url: '/hotel/order/create',
            method: 'POST',
            data
        });
    },

    /**
     * 用户支付，更新订单状态并插入 order_details
     */
    payOrder(data: {
        order_id: string; real_pay: number; total_price: number; room_count: number;
        special_request?: string; idcards: string;
        daily: { date: string; price: number; breakfast_count: number }[];
    }) {
        return request<{ message: string; data: { order_id: string } }>({
            url: '/hotel/order/pay',
            method: 'POST',
            data
        });
    },

    /**
     * 未支付退出时的订单信息同步更新
     */
    updatePendingOrder(data: {
        order_id: string; real_pay: number; total_price: number; room_count: number;
        special_request?: string; idcards: string;
        daily: { date: string; price: number; breakfast_count: number }[];
    }) {
        return request<{ message: string }>({
            url: '/hotel/order/update',
            method: 'POST',
            data
        });
    },

    /**
     * 获取用户订单列表
     */
    getUserOrders(data: { user_id: string }) {
        return request<{ message: string; data: any[] }>({
            url: '/hotel/order/list',
            method: 'POST',
            data
        });
    },

    /**
     * 删除订单（同时删除 order_details）
     */
    deleteOrder(data: { order_id: string }) {
        return request<{ message: string }>({
            url: '/hotel/order/delete',
            method: 'POST',
            data
        });
    },

    /**
     * 取消订单（状态改为已取消）
     */
    cancelOrder(data: { order_id: string }) {
        return request<{ message: string }>({
            url: '/hotel/order/cancel',
            method: 'POST',
            data
        });
    },

    /**
     * 获取订单详情
     */
    getOrderDetail(data: { order_id: string }) {
        return request<{ message: string; data: any }>({
            url: '/hotel/order/detail',
            method: 'POST',
            data
        });
    },

    /**
     * 获取酒店评价列表
     */
    getHotelReviews(data: { hotel_id: string }) {
        return request<{ message: string; data: any }>({
            url: '/hotel/reviews',
            method: 'POST',
            data
        });
    },

    // ===================== 浏览历史 =====================

    /**
     * 添加浏览历史
     */
    addViewHistory(data: { user_id: string; hotel_id: string }) {
        return request<{ message: string }>({
            url: '/user/history/add',
            method: 'POST',
            data
        });
    },

    /**
     * 获取用户浏览历史
     */
    getViewHistory(data: { user_id: string }) {
        return request<{ message: string; data: any[] }>({
            url: '/user/history/list',
            method: 'POST',
            data
        });
    },

    // ===================== 收藏 =====================

    /**
     * 切换收藏状态
     */
    toggleFavorite(data: { user_id: string; target_id: string; type: number }) {
        return request<{ message: string; data: { is_favorite: boolean } }>({
            url: '/user/favorite/toggle',
            method: 'POST',
            data
        });
    },

    /**
     * 检查是否已收藏
     */
    checkFavorite(data: { user_id: string; target_id: string; type: number }) {
        return request<{ message: string; data: { is_favorite: boolean } }>({
            url: '/user/favorite/check',
            method: 'POST',
            data
        });
    },

    /**
     * 获取用户收藏列表
     */
    getFavorites(data: { user_id: string }) {
        return request<{ message: string; data: any[] }>({
            url: '/user/favorite/list',
            method: 'POST',
            data
        });
    },

    /**
     * 提交用户评价
     */
    addReview(data: { order_id: string; hotel_id: string; user_id: string; score: number; content: string; tags: string[]; images?: string[] }) {
        return request<{ message: string; data: { review_id: string } }>({
            url: '/hotel/review/add',
            method: 'POST',
            data
        });
    },

    /**
     * 获取全部福利中心优惠券列表
     */
    getCouponsList() {
        return request<any[]>({
            url: '/coupons',
            method: 'GET'
        });
    },

    /**
     * 用户领取优惠券
     */
    claimCoupon(data: { coupon_id: string; user_id?: string }) {
        return request<{ message: string; user_coupons_id: string }>({
            url: '/user-coupons/claim',
            method: 'POST',
            data
        });
    },

    /**
     * 获取用户个人的优惠券列表
     */
    getUserCoupons(params?: { status?: number }) {
        // user_id is handled by backend or optionally passed
        return request<any[]>({
            url: '/user-coupons/my',
            method: 'GET',
            data: params
        });
    }
};
