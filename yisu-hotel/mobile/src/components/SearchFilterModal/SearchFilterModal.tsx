import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './SearchFilterModal.scss';

// ---- 筛选数据定义 ----
const SCORE_OPTIONS = [
    { label: '4.7分以上', value: 4.7 },
    { label: '4.5分以上', value: 4.5 },
    { label: '4分以上', value: 4.0 },
];

const REVIEW_COUNT_OPTIONS = [
    { label: '500条以上', value: 500 },
    { label: '100条以上', value: 100 },
    { label: '50条以上', value: 50 },
];

const GUEST_IMPRESSION_OPTIONS = [
    '早餐很棒', '温泉舒适', '自助餐棒', '推荐亲子入住',
    '空调给力', '咖啡很棒', '网络好', '洗漱品不错',
];

const HOTEL_TYPE_OPTIONS = [
    { label: '经济型', value: 1 },
    { label: '舒适型', value: 2 },
    { label: '高档型', value: 3 },
    { label: '豪华型', value: 4 },
];

const THEME_OPTIONS = [
    '电竞酒店', '温泉泡汤', '适合家庭', '亲子酒店',
    '窗外好景', '近地铁', '海景房', '民宿',
    '商务出差', '情侣推荐',
];

const PRICE_PRESETS = [
    { label: '¥0-100', min: 0, max: 100 },
    { label: '¥100-200', min: 100, max: 200 },
    { label: '¥200-300', min: 200, max: 300 },
    { label: '¥300-400', min: 300, max: 400 },
    { label: '¥400-600', min: 400, max: 600 },
    { label: '¥600-800', min: 600, max: 800 },
    { label: '¥800-1000', min: 800, max: 1000 },
    { label: '¥1000+', min: 1000, max: 99999 },
];

const DISTANCE_OPTIONS = [1, 3, 5, 10, 20];

const MIN_LIMIT = 0;
const MAX_LIMIT = 1500;

// 侧边栏 sections — 右侧按此顺序垂直排列全部内容
const SECTIONS = [
    { key: 'review', label: '点评' },
    { key: 'hotelType', label: '酒店类型' },
    { key: 'theme', label: '主题类型' },
    { key: 'price', label: '价格区间' },
    { key: 'location', label: '位置区域' },
] as const;

type SectionKey = typeof SECTIONS[number]['key'];

// ---- 筛选结果接口 ----
export interface MoreFilterResult {
    minScore: number | null;
    minReviews: number | null;
    impressions: string[];
    hotelTypes: number[];
    themes: string[];          // 模糊匹配 tags 字段
    minPrice: number;
    maxPrice: number;
    distance: number | null;
}

interface SearchFilterModalProps {
    isOpen: boolean;
    initialValues?: Partial<MoreFilterResult>;
    onClose: () => void;
    onConfirm: (result: MoreFilterResult) => void;
}

const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
    isOpen,
    initialValues,
    onClose,
    onConfirm,
}) => {
    const [activeSection, setActiveSection] = useState<SectionKey>('review');

    // Filter state
    const [minScore, setMinScore] = useState<number | null>(null);
    const [minReviews, setMinReviews] = useState<number | null>(null);
    const [impressions, setImpressions] = useState<string[]>([]);
    const [hotelTypes, setHotelTypes] = useState<number[]>([]);
    const [themes, setThemes] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(MAX_LIMIT);
    const [distance, setDistance] = useState<number | null>(null);
    const [sliderRect, setSliderRect] = useState<any>(null);
    const [scrollTarget, setScrollTarget] = useState('');

    // Section top offsets for scroll-tracking
    const sectionTops = useRef<Record<string, number>>({});
    const isUserTapping = useRef(false);

    const measureSections = useCallback(() => {
        const query = Taro.createSelectorQuery();
        SECTIONS.forEach(s => {
            query.select(`#sfm-section-${s.key}`).boundingClientRect();
        });
        query.select('.sfm__main').boundingClientRect();
        query.exec((results) => {
            if (!results) return;
            const containerRect = results[results.length - 1];
            if (!containerRect) return;
            const containerTop = containerRect.top || 0;
            SECTIONS.forEach((s, i) => {
                const rect = results[i];
                if (rect) {
                    sectionTops.current[s.key] = (rect.top || 0) - containerTop;
                }
            });
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            setActiveSection('review');
            setMinScore(initialValues?.minScore ?? null);
            setMinReviews(initialValues?.minReviews ?? null);
            setImpressions(initialValues?.impressions ?? []);
            setHotelTypes(initialValues?.hotelTypes ?? []);
            setThemes(initialValues?.themes ?? []);
            setMinPrice(Math.min(initialValues?.minPrice ?? 0, MAX_LIMIT));
            setMaxPrice(Math.min((initialValues?.maxPrice ?? 99999) === 99999 ? MAX_LIMIT : (initialValues?.maxPrice ?? MAX_LIMIT), MAX_LIMIT));
            setDistance(initialValues?.distance ?? null);

            setTimeout(() => {
                measureSections();
                // Measure slider
                const q2 = Taro.createSelectorQuery();
                q2.select('.sfm__slider').boundingClientRect((rect) => {
                    if (rect) setSliderRect(rect);
                }).exec();
            }, 400);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ---- Scroll handler: auto-highlight sidebar ----
    const handleScroll = (e: any) => {
        if (isUserTapping.current) return;
        const scrollTop = e.detail?.scrollTop || 0;
        // Find the section whose top is closest to scrollTop
        let current: SectionKey = 'review';
        for (const s of SECTIONS) {
            const top = sectionTops.current[s.key];
            if (top !== undefined && scrollTop >= top - 30) {
                current = s.key;
            }
        }
        setActiveSection(current);
    };

    // ---- Sidebar click => scroll to section ----
    const handleSidebarClick = (key: SectionKey) => {
        setActiveSection(key);
        isUserTapping.current = true;
        // Reset then set to trigger scroll even if same section
        setScrollTarget('');
        setTimeout(() => {
            setScrollTarget(`sfm-section-${key}`);
        }, 50);
        setTimeout(() => {
            isUserTapping.current = false;
        }, 600);
    };


    // ---- Slider handlers ----
    const getValueFromClientX = (clientX: number) => {
        if (!sliderRect) return 0;
        const pct = Math.min(Math.max(0, (clientX - sliderRect.left) / sliderRect.width), 1);
        return Math.round(pct * (MAX_LIMIT - MIN_LIMIT) + MIN_LIMIT);
    };

    const handleTrackTouch = (e: any) => {
        const v = getValueFromClientX(e.touches[0].clientX);
        if (Math.abs(v - minPrice) < Math.abs(v - maxPrice)) {
            setMinPrice(Math.min(v, maxPrice - 10));
        } else {
            setMaxPrice(Math.max(v, minPrice + 10));
        }
    };

    const handleThumbMove = (type: 'min' | 'max') => (e: any) => {
        e.stopPropagation();
        const v = getValueFromClientX(e.touches[0].clientX);
        if (type === 'min') setMinPrice(Math.min(Math.max(MIN_LIMIT, v), maxPrice - 50));
        else setMaxPrice(Math.max(Math.min(MAX_LIMIT, v), minPrice + 50));
    };

    // ---- Toggle helpers ----
    const toggleItem = <T,>(arr: T[], item: T, setter: (v: T[]) => void) => {
        setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
    };

    const handleClear = () => {
        setMinScore(null); setMinReviews(null); setImpressions([]);
        setHotelTypes([]); setThemes([]);
        setMinPrice(0); setMaxPrice(MAX_LIMIT); setDistance(null);
    };

    const handleConfirm = () => {
        onConfirm({
            minScore, minReviews, impressions, hotelTypes, themes,
            minPrice, maxPrice: maxPrice >= MAX_LIMIT ? 99999 : maxPrice, distance,
        });
        onClose();
    };

    const minPct = ((minPrice - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100;
    const maxPct = ((maxPrice - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100;

    return (
        <View className="sfm">
            <View className="sfm__backdrop" onClick={onClose} />
            <View className="sfm__content">
                {/* Header */}
                <View className="sfm__header">
                    <View className="sfm__close-btn" onClick={onClose}>
                        <Text className="sfm__close-icon">×</Text>
                    </View>
                    <Text className="sfm__title">更多筛选</Text>
                </View>

                {/* Split view: sidebar + scrollable main */}
                <View className="sfm__split-view">
                    {/* Sidebar */}
                    <ScrollView scrollY className="sfm__sidebar">
                        {SECTIONS.map(s => (
                            <View
                                key={s.key}
                                className={`sfm__sidebar-btn ${activeSection === s.key ? 'sfm__sidebar-btn--active' : ''}`}
                                onClick={() => handleSidebarClick(s.key)}
                            >
                                {activeSection === s.key && <View className="sfm__sidebar-indicator" />}
                                <Text>{s.label}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Main scrollable area — ALL sections rendered vertically */}
                    <ScrollView
                        scrollY
                        className="sfm__main"
                        scrollIntoView={scrollTarget}
                        onScroll={handleScroll}
                        scrollWithAnimation
                    >
                        {/* ======= 点评 ======= */}
                        <View id="sfm-section-review" className="sfm__section">
                            <Text className="sfm__section-heading">点评</Text>

                            <Text className="sfm__section-sub">评分</Text>
                            <View className="sfm__filter-tags">
                                {SCORE_OPTIONS.map(opt => (
                                    <View key={opt.value}
                                        className={`sfm__filter-tag ${minScore === opt.value ? 'sfm__filter-tag--active' : ''}`}
                                        onClick={() => setMinScore(minScore === opt.value ? null : opt.value)}>
                                        <Text>{opt.label}</Text>
                                    </View>
                                ))}
                            </View>

                            <Text className="sfm__section-sub">数量</Text>
                            <View className="sfm__filter-tags">
                                {REVIEW_COUNT_OPTIONS.map(opt => (
                                    <View key={opt.value}
                                        className={`sfm__filter-tag ${minReviews === opt.value ? 'sfm__filter-tag--active' : ''}`}
                                        onClick={() => setMinReviews(minReviews === opt.value ? null : opt.value)}>
                                        <Text>{opt.label}</Text>
                                    </View>
                                ))}
                            </View>

                            <Text className="sfm__section-sub">住客印象</Text>
                            <View className="sfm__filter-tags">
                                {GUEST_IMPRESSION_OPTIONS.map(item => (
                                    <View key={item}
                                        className={`sfm__filter-tag ${impressions.includes(item) ? 'sfm__filter-tag--active' : ''}`}
                                        onClick={() => toggleItem(impressions, item, setImpressions)}>
                                        <Text>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ======= 酒店类型 ======= */}
                        <View id="sfm-section-hotelType" className="sfm__section">
                            <Text className="sfm__section-heading">酒店类型</Text>
                            <View className="sfm__filter-tags">
                                {HOTEL_TYPE_OPTIONS.map(opt => (
                                    <View key={opt.value}
                                        className={`sfm__filter-tag ${hotelTypes.includes(opt.value) ? 'sfm__filter-tag--active' : ''}`}
                                        onClick={() => toggleItem(hotelTypes, opt.value, setHotelTypes)}>
                                        <Text>{opt.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ======= 主题类型 (模糊匹配 tags) ======= */}
                        <View id="sfm-section-theme" className="sfm__section">
                            <Text className="sfm__section-heading">主题类型</Text>
                            <View className="sfm__filter-tags">
                                {THEME_OPTIONS.map(item => (
                                    <View key={item}
                                        className={`sfm__filter-tag ${themes.includes(item) ? 'sfm__filter-tag--active' : ''}`}
                                        onClick={() => toggleItem(themes, item, setThemes)}>
                                        <Text>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ======= 价格区间 ======= */}
                        <View id="sfm-section-price" className="sfm__section">
                            <Text className="sfm__section-heading">价格区间</Text>
                            <View className="sfm__price-labels">
                                <Text>¥{minPrice}</Text>
                                <Text>¥{maxPrice >= MAX_LIMIT ? `${MAX_LIMIT}+` : maxPrice}</Text>
                            </View>
                            <View className="sfm__slider" onTouchStart={handleTrackTouch}>
                                <View className="sfm__slider-track" />
                                <View className="sfm__slider-active" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
                                <View className="sfm__slider-thumb" style={{ left: `${minPct}%`, transform: 'translateX(-50%)' }} onTouchMove={handleThumbMove('min')}>
                                    <View className="sfm__slider-thumb-dot" />
                                </View>
                                <View className="sfm__slider-thumb" style={{ left: `${maxPct}%`, transform: 'translateX(-50%)' }} onTouchMove={handleThumbMove('max')}>
                                    <View className="sfm__slider-thumb-dot" />
                                </View>
                            </View>
                            <View className="sfm__presets">
                                {PRICE_PRESETS.map(p => {
                                    const isActive = minPrice === p.min && (p.max === 99999 ? maxPrice >= MAX_LIMIT : maxPrice === p.max);
                                    return (
                                        <View key={p.label} className={`sfm__preset-btn ${isActive ? 'sfm__preset-btn--active' : ''}`}
                                            onClick={() => { setMinPrice(p.min); setMaxPrice(p.max === 99999 ? MAX_LIMIT : p.max); }}>
                                            <Text>{p.label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* ======= 位置区域 ======= */}
                        <View id="sfm-section-location" className="sfm__section">
                            <Text className="sfm__section-heading">位置区域</Text>
                            <Text className="sfm__section-sub">与我的直线距离</Text>
                            <View className="sfm__distance-list">
                                <View className={`sfm__distance-btn ${distance === null ? 'sfm__distance-btn--active' : ''}`}
                                    onClick={() => setDistance(null)}>
                                    <Text>不限距离</Text>
                                    {distance === null && <Text className="sfm__distance-check">✓</Text>}
                                </View>
                                {DISTANCE_OPTIONS.map(d => (
                                    <View key={d} className={`sfm__distance-btn ${distance === d ? 'sfm__distance-btn--active' : ''}`}
                                        onClick={() => setDistance(d)}>
                                        <Text>{d} km 以内</Text>
                                        {distance === d && <Text className="sfm__distance-check">✓</Text>}
                                    </View>
                                ))}
                            </View>
                            <Text className="sfm__location-tip">* 需授权定位权限以计算距离</Text>
                        </View>

                        {/* Bottom padding */}
                        <View style={{ height: '80px' }} />
                    </ScrollView>
                </View>

                {/* Footer */}
                <View className="sfm__footer">
                    <View className="sfm__clear-btn" onClick={handleClear}>
                        <Text>清空</Text>
                    </View>
                    <View className="sfm__confirm-btn" onClick={handleConfirm}>
                        <Text>查看</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default SearchFilterModal;
