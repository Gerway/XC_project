import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useReady } from '@tarojs/taro';
import './FilterModal.scss';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (range: [number, number], stars: number[]) => void;
    initialRange?: [number, number];
    initialStars?: number[];
}

const STAR_COLOR_MAP: Record<number, string> = {
    5: 'filter-modal__brand-icon--red',
    4: 'filter-modal__brand-icon--blue',
    3: 'filter-modal__brand-icon--orange-4',
    2: 'filter-modal__brand-icon--emerald',
    1: 'filter-modal__brand-icon--purple',
};

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialRange = [0, 1000],
    initialStars = []
}) => {
    const [activeTab, setActiveTab] = useState('Star Rating');
    const [minPrice, setMinPrice] = useState(initialRange[0]);
    const [maxPrice, setMaxPrice] = useState(initialRange[1]);
    const [selectedStars, setSelectedStars] = useState<number[]>(initialStars);
    const [sliderRect, setSliderRect] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setMinPrice(initialRange[0]);
            setMaxPrice(initialRange[1]);
            setSelectedStars(initialStars);

            // Get slider dimensions for touch calculations
            setTimeout(() => {
                const query = Taro.createSelectorQuery();
                query.select('.filter-modal__slider').boundingClientRect((rect) => {
                    if (rect) setSliderRect(rect);
                }).exec();
            }, 300); // Small delay for mount
        }
    }, [isOpen]);

    const starsList = [
        { id: 5, name: '5 Stars (Luxury)' },
        { id: 4, name: '4 Stars (Premium)' },
        { id: 3, name: '3 Stars (Comfort)' },
        { id: 2, name: '2 Stars (Economy)' },
        { id: 1, name: '1 Star (Budget)' },
    ];

    const pricePresets = [
        { label: '¥0-100', min: 0, max: 100 },
        { label: '¥100-200', min: 100, max: 200 },
        { label: '¥200-300', min: 200, max: 300 },
        { label: '¥300-400', min: 300, max: 400 },
        { label: '¥400-600', min: 400, max: 600 },
        { label: '¥600-800', min: 600, max: 800 },
        { label: '¥800-1000', min: 800, max: 1000 },
        { label: '¥1000+', min: 1000, max: 1500 },
    ];

    const minLimit = 0;
    const maxLimit = 1500;

    const getValueFromClientX = (clientX: number) => {
        if (!sliderRect) return 0;
        const percent = Math.min(Math.max(0, (clientX - sliderRect.left) / sliderRect.width), 1);
        return Math.round(percent * (maxLimit - minLimit) + minLimit);
    };

    const handleTrackTouch = (e: any) => {
        const clientX = e.touches[0].clientX;
        const value = getValueFromClientX(clientX);
        const distMin = Math.abs(value - minPrice);
        const distMax = Math.abs(value - maxPrice);

        if (distMin < distMax) {
            setMinPrice(Math.min(value, maxPrice - 10));
        } else {
            setMaxPrice(Math.max(value, minPrice + 10));
        }
    };

    const handleTouchMove = (type: 'min' | 'max') => (e: any) => {
        e.stopPropagation();
        const clientX = e.touches[0].clientX;
        const value = getValueFromClientX(clientX);

        if (type === 'min') {
            setMinPrice(prev => Math.min(Math.max(minLimit, value), maxPrice - 50));
        } else {
            setMaxPrice(prev => Math.max(Math.min(maxLimit, value), minPrice + 50));
        }
    };

    const handlePresetClick = (min: number, max: number) => {
        setMinPrice(min);
        setMaxPrice(max);
    };

    const toggleStar = (starId: number) => {
        setSelectedStars(prev =>
            prev.includes(starId)
                ? prev.filter(id => id !== starId)
                : [...prev, starId]
        );
    };

    const handleSelectAllStars = () => {
        if (selectedStars.length === starsList.length) {
            setSelectedStars([]);
        } else {
            setSelectedStars(starsList.map(s => s.id));
        }
    };

    const handleConfirm = () => {
        onConfirm([minPrice, maxPrice], selectedStars);
        onClose();
    };

    const handleClear = () => {
        setMinPrice(0);
        setMaxPrice(1500);
        setSelectedStars([]);
    };

    const minPercent = ((minPrice - minLimit) / (maxLimit - minLimit)) * 100;
    const maxPercent = ((maxPrice - minLimit) / (maxLimit - minLimit)) * 100;

    if (!isOpen) return null;

    return (
        <View className="filter-modal">
            {/* Backdrop */}
            <View className="filter-modal__backdrop" onClick={onClose}></View>

            {/* Modal Content */}
            <View className="filter-modal__content">
                {/* Header */}
                <View className="filter-modal__header">
                    <View onClick={onClose} className="filter-modal__close-btn">
                        <Text className="material-symbols-outlined filter-modal__close-icon">close</Text>
                    </View>
                    <Text className="filter-modal__title">Filter Stars & Price</Text>
                </View>

                {/* Price Section */}
                <View className="filter-modal__price-section">
                    <Text className="filter-modal__price-title">Price Range</Text>

                    <View className="filter-modal__price-labels">
                        <Text>¥{minPrice}</Text>
                        <Text>¥{maxPrice === maxLimit ? `${maxLimit}+` : maxPrice}</Text>
                    </View>

                    {/* Custom Slider */}
                    <View
                        className="filter-modal__slider"
                        onTouchStart={handleTrackTouch}
                    >
                        <View className="filter-modal__slider-track"></View>
                        <View
                            className="filter-modal__slider-active"
                            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                        ></View>

                        {/* Min Thumb */}
                        <View
                            className="filter-modal__slider-thumb"
                            style={{ left: `${minPercent}%`, transform: 'translateX(-50%)' }}
                            onTouchMove={handleTouchMove('min')}
                        >
                            <View className="filter-modal__slider-thumb-dot"></View>
                        </View>

                        {/* Max Thumb */}
                        <View
                            className="filter-modal__slider-thumb"
                            style={{ left: `${maxPercent}%`, transform: 'translateX(-50%)' }}
                            onTouchMove={handleTouchMove('max')}
                        >
                            <View className="filter-modal__slider-thumb-dot"></View>
                        </View>
                    </View>

                    {/* Presets */}
                    <View className="filter-modal__presets">
                        {pricePresets.map(preset => {
                            const isSelected = minPrice === preset.min && maxPrice === preset.max;
                            return (
                                <View
                                    key={preset.label}
                                    onClick={() => handlePresetClick(preset.min, preset.max)}
                                    className={`filter-modal__preset-btn ${isSelected ? 'filter-modal__preset-btn--selected' : ''}`}
                                >
                                    <Text>{preset.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Split View */}
                <View className="filter-modal__split-view">
                    {/* Sidebar */}
                    <ScrollView scrollY className="filter-modal__sidebar">
                        {['Star Rating', 'Hot Spot', 'District', 'Distance'].map(item => (
                            <View
                                key={item}
                                onClick={() => setActiveTab(item)}
                                className={`filter-modal__sidebar-btn ${activeTab === item ? 'filter-modal__sidebar-btn--active' : ''}`}
                            >
                                {activeTab === item && (
                                    <View className="filter-modal__sidebar-indicator"></View>
                                )}
                                <Text>{item}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Main Content */}
                    <ScrollView scrollY className="filter-modal__main-content">
                        {activeTab === 'Star Rating' && (
                            <View>
                                <View className="filter-modal__brands-header">
                                    <Text className="filter-modal__brands-title">Hotel Star Ratings</Text>
                                    <View
                                        onClick={handleSelectAllStars}
                                        className="filter-modal__select-all-btn"
                                    >
                                        <Text>{selectedStars.length === starsList.length ? 'Deselect All' : 'Select All'}</Text>
                                    </View>
                                </View>

                                <View className="filter-modal__brands-grid">
                                    {starsList.map(star => {
                                        const isSelected = selectedStars.includes(star.id);
                                        return (
                                            <View
                                                key={star.id}
                                                onClick={() => toggleStar(star.id)}
                                                className={`filter-modal__brand-btn ${isSelected ? 'filter-modal__brand-btn--selected' : ''}`}
                                            >
                                                <View className={`filter-modal__brand-icon ${STAR_COLOR_MAP[star.id] || ''}`}>
                                                    <Text>{star.id}</Text>
                                                </View>
                                                <Text className={`filter-modal__brand-name ${isSelected ? 'filter-modal__brand-name--selected' : ''}`}>
                                                    {star.name.split(' ')[0]} {/* just "5" or "4" or show full */}
                                                </Text>
                                                {isSelected && (
                                                    <View className="filter-modal__brand-check">
                                                        <View className="filter-modal__brand-check-triangle"></View>
                                                        <Text className="material-symbols-outlined filter-modal__brand-check-icon">check</Text>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Footer */}
                <View className="filter-modal__footer">
                    <Button
                        onClick={handleClear}
                        className="filter-modal__clear-all-btn"
                    >
                        Clear All
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="filter-modal__confirm-btn"
                    >
                        Confirm {selectedStars.length > 0 ? `(${selectedStars.length})` : ''}
                    </Button>
                </View>
            </View>
        </View>
    );
};

export default FilterModal;
