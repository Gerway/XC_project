import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useReady } from '@tarojs/taro';
import './FilterModal.scss';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (range: [number, number], brands: string[]) => void;
    initialRange?: [number, number];
    initialBrands?: string[];
}

const BRAND_COLOR_MAP: Record<string, string> = {
    'Ibis': 'filter-modal__brand-icon--red',
    'HanTing': 'filter-modal__brand-icon--blue',
    'Ji Hotel': 'filter-modal__brand-icon--orange-4',
    'Orange': 'filter-modal__brand-icon--orange-5',
    'Home Inn': 'filter-modal__brand-icon--yellow',
    'Mercure': 'filter-modal__brand-icon--purple',
    'Crystal': 'filter-modal__brand-icon--emerald',
    'All Season': 'filter-modal__brand-icon--indigo',
    'Starway': 'filter-modal__brand-icon--blue-4',
    'CitiGO': 'filter-modal__brand-icon--black',
};

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialRange = [0, 1000],
    initialBrands = []
}) => {
    const [activeTab, setActiveTab] = useState('Brand');
    const [minPrice, setMinPrice] = useState(initialRange[0]);
    const [maxPrice, setMaxPrice] = useState(initialRange[1]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
    const [sliderRect, setSliderRect] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setMinPrice(initialRange[0]);
            setMaxPrice(initialRange[1]);
            setSelectedBrands(initialBrands);

            // Get slider dimensions for touch calculations
            setTimeout(() => {
                const query = Taro.createSelectorQuery();
                query.select('.filter-modal__slider').boundingClientRect((rect) => {
                    if (rect) setSliderRect(rect);
                }).exec();
            }, 300); // Small delay for mount
        }
    }, [isOpen]);

    const brands = [
        { id: 'Ibis', name: 'Ibis' },
        { id: 'HanTing', name: 'HanTing' },
        { id: 'Ji Hotel', name: 'Ji Hotel' },
        { id: 'Orange', name: 'Orange' },
        { id: 'Home Inn', name: 'Home Inn' },
        { id: 'Mercure', name: 'Mercure' },
        { id: 'Crystal', name: 'Crystal' },
        { id: 'All Season', name: 'All Season' },
        { id: 'Starway', name: 'Starway' },
        { id: 'CitiGO', name: 'CitiGO' },
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

    const toggleBrand = (brandId: string) => {
        setSelectedBrands(prev =>
            prev.includes(brandId)
                ? prev.filter(id => id !== brandId)
                : [...prev, brandId]
        );
    };

    const handleSelectAllBrands = () => {
        if (selectedBrands.length === brands.length) {
            setSelectedBrands([]);
        } else {
            setSelectedBrands(brands.map(b => b.id));
        }
    };

    const handleConfirm = () => {
        onConfirm([minPrice, maxPrice], selectedBrands);
        onClose();
    };

    const handleClear = () => {
        setMinPrice(0);
        setMaxPrice(1500);
        setSelectedBrands([]);
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
                    <Text className="filter-modal__title">Filter Brand & Price</Text>
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
                        {['Brand', 'Hot Spot', 'District', 'Metro', 'Landmark', 'Distance'].map(item => (
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
                        {activeTab === 'Brand' && (
                            <View>
                                <View className="filter-modal__brands-header">
                                    <Text className="filter-modal__brands-title">Hotel Brands</Text>
                                    <View
                                        onClick={handleSelectAllBrands}
                                        className="filter-modal__select-all-btn"
                                    >
                                        <Text>{selectedBrands.length === brands.length ? 'Deselect All' : 'Select All'}</Text>
                                    </View>
                                </View>

                                <View className="filter-modal__brands-grid">
                                    {brands.map(brand => {
                                        const isSelected = selectedBrands.includes(brand.id);
                                        return (
                                            <View
                                                key={brand.id}
                                                onClick={() => toggleBrand(brand.id)}
                                                className={`filter-modal__brand-btn ${isSelected ? 'filter-modal__brand-btn--selected' : ''}`}
                                            >
                                                <View className={`filter-modal__brand-icon ${BRAND_COLOR_MAP[brand.id] || ''}`}>
                                                    <Text>{brand.name[0]}</Text>
                                                </View>
                                                <Text className={`filter-modal__brand-name ${isSelected ? 'filter-modal__brand-name--selected' : ''}`}>
                                                    {brand.name}
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
                        Confirm {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}
                    </Button>
                </View>
            </View>
        </View>
    );
};

export default FilterModal;
