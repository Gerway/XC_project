import { request } from '../utils/request';

export interface Hotel {
    hotel_id: number;
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
    }
};
