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
    }
};
