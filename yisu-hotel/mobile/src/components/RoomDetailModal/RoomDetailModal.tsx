import React, { useState } from 'react';
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components';
import { RoomDetails } from '../../api/hotel';
import './RoomDetailModal.scss';

interface RoomDetailModalProps {
    isOpen: boolean;
    room: RoomDetails | null;
    onClose: () => void;
    onBook: () => void;
}

const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ isOpen, room, onClose, onBook }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!isOpen || !room) return null;

    const images = room.images && room.images.length > 0
        ? room.images
        : (room.image_url ? [room.image_url] : []);

    const floorStr = (() => {
        if (!room.floor || room.floor.length === 0) return '—';
        if (room.floor.length === 1) return `${room.floor[0]}层`;
        const min = Math.min(...room.floor);
        const max = Math.max(...room.floor);
        return min === max ? `${min}层` : `${min}-${max}层`;
    })();

    const windowStr = room.has_window === 1 ? '有窗' : (room.has_window === 0 ? '无窗' : '—');
    const addBedStr = room.add_bed === 1 ? '可加床' : '不可加床';
    const wifiStr = room.has_wifi === 1 ? '有WiFi' : '无WiFi';
    const smokingStr = room.remark || '—';

    return (
        <View className="room-detail-modal">
            <View className="room-detail-modal__backdrop" onClick={onClose}></View>
            <View className="room-detail-modal__content">
                {/* Header */}
                <View className="room-detail-modal__header">
                    <View className="room-detail-modal__close" onClick={onClose}>
                        <Text>×</Text>
                    </View>
                    <Text className="room-detail-modal__title">房型</Text>
                    <View style={{ width: '32px' }}></View>
                </View>

                {/* Swiper */}
                <View className="room-detail-modal__swiper-wrapper">
                    {images.length > 0 ? (
                        <Swiper
                            className="room-detail-modal__swiper"
                            circular
                            onChange={(e) => setCurrentIndex(e.detail.current)}
                        >
                            {images.map((url, idx) => (
                                <SwiperItem key={idx}>
                                    <Image src={url} className="room-detail-modal__swiper-img" mode="aspectFill" />
                                </SwiperItem>
                            ))}
                        </Swiper>
                    ) : (
                        <View className="room-detail-modal__no-image">
                            <Text>暂无图片</Text>
                        </View>
                    )}
                    {images.length > 1 && (
                        <View className="room-detail-modal__swiper-indicator">
                            <Text>{currentIndex + 1}/{images.length}</Text>
                        </View>
                    )}
                </View>

                {/* Room Info Grid */}
                <View className="room-detail-modal__info">
                    <View className="room-detail-modal__info-row">
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">面积</Text>
                            <Text className="room-detail-modal__info-value">{room.area}m²</Text>
                        </View>
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">可住</Text>
                            <Text className="room-detail-modal__info-value">{room.max_occupancy || 2}人</Text>
                        </View>
                    </View>
                    <View className="room-detail-modal__info-row">
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">楼层</Text>
                            <Text className="room-detail-modal__info-value">{floorStr}</Text>
                        </View>
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">床型</Text>
                            <Text className="room-detail-modal__info-value">{room.room_bed || '—'}</Text>
                        </View>
                    </View>
                    <View className="room-detail-modal__info-row">
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">窗户</Text>
                            <Text className="room-detail-modal__info-value">{windowStr}</Text>
                        </View>
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">加床</Text>
                            <Text className="room-detail-modal__info-value">{addBedStr}</Text>
                        </View>
                    </View>
                    <View className="room-detail-modal__info-row">
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">宽带</Text>
                            <Text className="room-detail-modal__info-value">{wifiStr}</Text>
                        </View>
                        <View className="room-detail-modal__info-cell">
                            <Text className="room-detail-modal__info-label">备注</Text>
                            <Text className="room-detail-modal__info-value">{smokingStr}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View className="room-detail-modal__footer">
                    <View className="room-detail-modal__book-btn" onClick={onBook}>
                        <Text className="room-detail-modal__book-btn-text">去预订</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default RoomDetailModal;
