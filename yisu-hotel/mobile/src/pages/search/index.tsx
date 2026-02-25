import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input, Map } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { hotelApi, SearchHotelsParams, Hotel } from '../../api/hotel';
import DatePicker from '../../components/DatePicker/DatePicker';
import CityPicker from '../../components/CityPicker/CityPicker';
import SearchFilterModal, { MoreFilterResult } from '../../components/SearchFilterModal/SearchFilterModal';
import './index.scss';

const BADGE_CLASS_MAP: Record<string, string> = {
  'Economy': '',
  'Comfort': 'search-page__hotel-badge--purple',
  'Upscale': 'search-page__hotel-badge--blue',
  'Luxury': 'search-page__hotel-badge--orange',
};

const HOTEL_TYPE_MAP: Record<number, { text: string, type: string }> = {
  1: { text: 'Economy', type: '经济型' },
  2: { text: 'Comfort', type: '舒适型' },
  3: { text: 'Upscale', type: '高档型' },
  4: { text: 'Luxury', type: '豪华套房' },
};

// 星级选项 (inline dropdown)
const STAR_OPTIONS = [2, 3, 4, 5];
// 价格快捷选项 (inline dropdown)
const PRICE_QUICK = [
  { label: '不限', min: 0, max: 99999 },
  { label: '¥0-200', min: 0, max: 200 },
  { label: '¥200-400', min: 200, max: 400 },
  { label: '¥400-600', min: 400, max: 600 },
  { label: '¥600-1000', min: 600, max: 1000 },
  { label: '¥1000+', min: 1000, max: 99999 },
];
// 距离选项 (inline dropdown)
const DISTANCE_OPTIONS = [1, 3, 5, 10, 20];

const Search: React.FC = () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };

  const defaultState = useMemo<SearchHotelsParams>(() => ({
    city_name: '重庆', keyword: '',
    check_in: getTodayStr(), check_out: getTomorrowStr(),
    min_price: 0, max_price: 99999, star_rating: [], room_type: 1,
  }), []);

  const [searchState, setSearchState] = useState<SearchHotelsParams>(defaultState);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isMapView, setIsMapView] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any | null>(null);
  const [keyword, setKeyword] = useState('');

  // Pickers
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Inline dropdown state (sort / star-price / location)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('recommended');

  // Star/Price inline dropdown values
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [tempStars, setTempStars] = useState<number[]>([]);
  const [selectedPrice, setSelectedPrice] = useState(PRICE_QUICK[0]);
  const [tempPrice, setTempPrice] = useState(PRICE_QUICK[0]);

  // Location inline dropdown values
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 更多筛选 modal
  const [isMoreFilterOpen, setIsMoreFilterOpen] = useState(false);

  // Quick filter chips
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [moreFilterValues, setMoreFilterValues] = useState<Partial<MoreFilterResult>>({});

  const sortOptions = [
    { label: '推荐排序', value: 'recommended' },
    { label: '距离由近到远', value: 'distance' },
    { label: '评分最高', value: 'score' },
    { label: '价格最低', value: 'price_asc' },
    { label: '价格最高', value: 'price_desc' },
  ];

  const fetchHotels = async (params: SearchHotelsParams) => {
    Taro.showLoading({ title: '搜索中...' });
    try {
      const res = await hotelApi.searchHotels(params);
      setHotels(res.data || []);
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '搜索失败', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  useDidShow(() => {
    try {
      const raw = Taro.getStorageSync('searchParams');
      if (raw) {
        const p: SearchHotelsParams = JSON.parse(raw);
        const s = {
          city_name: p.city_name || defaultState.city_name,
          keyword: p.keyword || '', check_in: p.check_in || defaultState.check_in,
          check_out: p.check_out || defaultState.check_out,
          min_price: p.min_price ?? 0, max_price: p.max_price ?? 99999,
          star_rating: p.star_rating || [], room_type: p.room_type || 1,
        };
        setSearchState(s); setKeyword(s.keyword || ''); fetchHotels(s);
      } else fetchHotels(defaultState);
    } catch { fetchHotels(defaultState); }
  });

  const dateRangeDisplay = useMemo(() => {
    if (!searchState.check_in || !searchState.check_out) return '';
    const fmt = (d: Date) => `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    return `${fmt(new Date(searchState.check_in))} 至 ${fmt(new Date(searchState.check_out))}`;
  }, [searchState.check_in, searchState.check_out]);

  const hotelsWithMeta = useMemo(() => hotels.map(hotel => {
    let parsedTags: string[] = [];
    if (typeof hotel.tags === 'string') { try { parsedTags = JSON.parse(hotel.tags); } catch { } }
    else if (Array.isArray(hotel.tags)) parsedTags = hotel.tags;
    return { ...hotel, parsedTags };
  }), [hotels]);

  const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const sortedHotels = useMemo(() => {
    let result = [...hotelsWithMeta];

    // Client-side "more filters"
    const mf = moreFilterValues;
    if (mf.minScore) result = result.filter(h => (h.score || 0) >= mf.minScore!);
    if (mf.minReviews) result = result.filter(h => (h.real_reviews_count || h.reviews || 0) >= mf.minReviews!);
    if (mf.hotelTypes && mf.hotelTypes.length > 0) result = result.filter(h => mf.hotelTypes!.includes(h.hotel_type));
    if (mf.themes && mf.themes.length > 0) {
      result = result.filter(h => {
        const tagsStr = (Array.isArray(h.parsedTags) ? h.parsedTags.join(' ') : (h.tags || '')).toLowerCase();
        return mf.themes!.some(theme => tagsStr.includes(theme.toLowerCase()));
      });
    }
    if (mf.distance && userLocation) {
      result = result.filter(h => {
        if (!h.latitude || !h.longitude) return true;
        return calcDistance(userLocation.lat, userLocation.lng, Number(h.latitude), Number(h.longitude)) <= mf.distance!;
      });
    }

    // Inline distance filter
    if (selectedDistance && userLocation) {
      result = result.filter(h => {
        if (!h.latitude || !h.longitude) return true;
        return calcDistance(userLocation.lat, userLocation.lng, Number(h.latitude), Number(h.longitude)) <= selectedDistance;
      });
    }

    // Quick chip filters
    if (activeChips.includes('4.7分以上')) result = result.filter(h => (h.score || 0) >= 4.7);
    if (activeChips.includes('20km以内') && userLocation) {
      result = result.filter(h => {
        if (!h.latitude || !h.longitude) return true;
        return calcDistance(userLocation.lat, userLocation.lng, Number(h.latitude), Number(h.longitude)) <= 20;
      });
    }
    if (activeChips.includes('高端型')) result = result.filter(h => h.hotel_type >= 3);
    if (activeChips.includes('泳池')) {
      result = result.filter(h => {
        const tagsStr = (Array.isArray(h.parsedTags) ? h.parsedTags.join(' ') : (h.tags || '')).toLowerCase();
        return tagsStr.includes('泳池') || tagsStr.includes('游泳');
      });
    }
    if (activeChips.includes('4星级及以上')) result = result.filter(h => (h.star_rating || 0) >= 4);

    switch (sortOption) {
      case 'distance':
        if (userLocation) result.sort((a, b) => {
          const da = (a.latitude && a.longitude) ? calcDistance(userLocation.lat, userLocation.lng, Number(a.latitude), Number(a.longitude)) : 9999;
          const db = (b.latitude && b.longitude) ? calcDistance(userLocation.lat, userLocation.lng, Number(b.latitude), Number(b.longitude)) : 9999;
          return da - db;
        });
        break;
      case 'score': result.sort((a, b: any) => (b.score || 0) - (a.score || 0)); break;
      case 'price_asc': result.sort((a, b) => a.min_price - b.min_price); break;
      case 'price_desc': result.sort((a, b) => b.min_price - a.min_price); break;
    }
    return result;
  }, [hotelsWithMeta, sortOption, selectedDistance, userLocation, moreFilterValues, activeChips]);

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) { setActiveDropdown(null); return; }
    // Init temp state for star/price dropdown
    if (name === 'starPrice') { setTempStars([...selectedStars]); setTempPrice(selectedPrice); }
    setActiveDropdown(name);
  };

  const getSortLabel = () => sortOptions.find(o => o.value === sortOption)?.label || '排序';

  // Star/Price apply
  const applyStarPrice = () => {
    setSelectedStars(tempStars);
    setSelectedPrice(tempPrice);
    const u = { ...searchState, star_rating: tempStars, min_price: tempPrice.min, max_price: tempPrice.max };
    setSearchState(u); fetchHotels(u); setActiveDropdown(null);
  };
  const resetStarPrice = () => { setTempStars([]); setTempPrice(PRICE_QUICK[0]); };

  // Distance select
  const handleDistanceSelect = (dist: number | null) => {
    if (!userLocation && dist !== null) {
      Taro.getLocation({
        type: 'gcj02',
        success: (res) => { setUserLocation({ lat: res.latitude, lng: res.longitude }); setSelectedDistance(dist); },
        fail: () => Taro.showToast({ title: '获取位置失败', icon: 'none' })
      });
    } else {
      setSelectedDistance(dist);
    }
    setActiveDropdown(null);
  };

  // 更多筛选 confirm
  const handleMoreFilterConfirm = (result: MoreFilterResult) => {
    setMoreFilterValues(result);
    // Apply price + stars from more-filter if set
    if (result.minPrice > 0 || result.maxPrice < 99999) {
      const u = { ...searchState, min_price: result.minPrice, max_price: result.maxPrice };
      setSearchState(u); fetchHotels(u);
    }
    if (result.hotelTypes.length > 0) {
      // hotel_type filter is client-side, no need to refetch
    }
    if (result.distance !== null && !userLocation) {
      Taro.getLocation({
        type: 'gcj02',
        success: (res) => setUserLocation({ lat: res.latitude, lng: res.longitude }),
        fail: () => { }
      });
    }
  };

  const starPriceActive = selectedStars.length > 0 || selectedPrice.min > 0 || selectedPrice.max < 99999;
  const distanceActive = selectedDistance !== null;
  const moreActive = (() => {
    const m = moreFilterValues;
    if (!m || Object.keys(m).length === 0) return false;
    return (m.minScore != null) || (m.minReviews != null) ||
      (m.impressions && m.impressions.length > 0) ||
      (m.hotelTypes && m.hotelTypes.length > 0) ||
      (m.themes && m.themes.length > 0) ||
      (m.minPrice != null && m.minPrice > 0) ||
      (m.maxPrice != null && m.maxPrice < 99999) ||
      (m.distance != null);
  })();

  const toggleChip = (chip: string) => {
    setActiveChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
    // For 20km chip, auto-request location
    if (chip === '20km以内' && !userLocation) {
      Taro.getLocation({
        type: 'gcj02',
        success: (res) => setUserLocation({ lat: res.latitude, lng: res.longitude }),
        fail: () => Taro.showToast({ title: '获取位置失败', icon: 'none' })
      });
    }
  };

  // Map
  const mapCenter = useMemo(() => {
    const v = sortedHotels.filter(h => h.latitude && h.longitude);
    if (!v.length) return { latitude: 29.5630, longitude: 106.5516 };
    return { latitude: v.reduce((s, h) => s + Number(h.latitude), 0) / v.length, longitude: v.reduce((s, h) => s + Number(h.longitude), 0) / v.length };
  }, [sortedHotels]);

  const mapMarkers = useMemo(() => sortedHotels.filter(h => h.latitude && h.longitude).map((h, i) => ({
    id: i, latitude: Number(h.latitude), longitude: Number(h.longitude), width: 60, height: 30,
    callout: { content: `¥${h.min_price}`, color: '#ffffff', bgColor: selectedHotel?.hotel_id === h.hotel_id ? '#10b981' : '#FF6B35', padding: 6, borderRadius: 14, display: 'ALWAYS', fontSize: 12, borderWidth: 0, borderColor: 'transparent', textAlign: 'center' }
  })), [sortedHotels, selectedHotel]);

  const handleMarkerTap = (e: any) => { const id = e.detail?.markerId; if (id !== undefined) setSelectedHotel(sortedHotels.filter(h => h.latitude && h.longitude)[id] || null); };

  return (
    <View className="search-page">
      <View className="search-page__header">
        <View className="search-page__top-bar">
          <View className="search-page__search-pill">
            <View className="search-page__search-city" onClick={() => setIsCityPickerOpen(true)}>
              <Text className="search-page__search-location">{searchState.city_name || 'All'}</Text>
              <Text className="search-page__search-location-arrow">▼</Text>
            </View>
            <View className="search-page__pill-divider" />
            <View className="search-page__search-dates-btn" onClick={() => setIsDatePickerOpen(true)}>
              <Text className="search-page__search-dates">{dateRangeDisplay}</Text>
            </View>
            <View className="search-page__pill-divider" />
            <Input className="search-page__search-input" placeholder="酒店 / 关键词" value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              onConfirm={() => { const u = { ...searchState, keyword }; setSearchState(u); fetchHotels(u); }}
            />
            {keyword && (
              <View onClick={() => { setKeyword(''); const u = { ...searchState, keyword: '' }; setSearchState(u); fetchHotels(u); }} className="search-page__search-clear-btn">
                <Text className="search-page__search-clear-icon">✕</Text>
              </View>
            )}
          </View>
          <View className="search-page__map-btn" onClick={() => { setIsMapView(v => !v); setSelectedHotel(null); }}>
            <View className="search-page__map-icon-wrapper">
              <Image src={isMapView ? 'https://api.iconify.design/lucide:list.svg?color=%23FF6B35' : 'https://api.iconify.design/lucide:map.svg?color=%23FF6B35'} style={{ width: 20, height: 20 }} />
            </View>
            <Text className="search-page__map-label">{isMapView ? '列表' : '地图'}</Text>
          </View>
        </View>

        {/* ==== Filter Bar ==== */}
        <View className="search-page__filter-bar">
          <View className="search-page__filter-bar-inner">
            {/* Sort */}
            <View onClick={() => toggleDropdown('sort')} className="search-page__sort-btn">
              <Text>{sortOption === 'recommended' ? '排序' : getSortLabel()}</Text>
              <Text className={`search-page__sort-arrow ${activeDropdown === 'sort' ? 'search-page__sort-arrow--open' : ''}`}>▼</Text>
            </View>
            {/* Star/Price */}
            <View onClick={() => toggleDropdown('starPrice')}
              className={`search-page__filter-btn ${starPriceActive || activeDropdown === 'starPrice' ? 'search-page__filter-btn--active' : ''}`}>
              <Text>星级/价格</Text>
              <Text className={`search-page__filter-arrow ${activeDropdown === 'starPrice' ? 'search-page__filter-arrow--open' : ''}`}>▼</Text>
            </View>
            {/* Location */}
            <View onClick={() => toggleDropdown('location')}
              className={`search-page__filter-btn ${distanceActive || activeDropdown === 'location' ? 'search-page__filter-btn--active' : ''}`}>
              <Text>{distanceActive ? `≤${selectedDistance}km` : '位置区域'}</Text>
              <Text className={`search-page__filter-arrow ${activeDropdown === 'location' ? 'search-page__filter-arrow--open' : ''}`}>▼</Text>
            </View>
            {/* More */}
            <View onClick={() => { setActiveDropdown(null); setIsMoreFilterOpen(true); }}
              className={`search-page__filter-btn ${moreActive ? 'search-page__filter-btn--active' : ''}`}>
              <Text>更多筛选</Text>
              <Text className="search-page__filter-arrow">▼</Text>
            </View>
          </View>

          {/* ---- Sort Dropdown ---- */}
          {activeDropdown === 'sort' && (
            <View className="search-page__dropdown">
              <View className="search-page__dropdown-list">
                {sortOptions.map(opt => (
                  <View key={opt.value} onClick={() => { setSortOption(opt.value); setActiveDropdown(null); }}
                    className={`search-page__dropdown-option ${sortOption === opt.value ? 'search-page__dropdown-option--active' : ''}`}>
                    <Text>{opt.label}</Text>
                    {sortOption === opt.value && <Text className="search-page__dropdown-check-icon">✓</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ---- Star/Price Dropdown Panel ---- */}
          {activeDropdown === 'starPrice' && (
            <View className="search-page__dropdown search-page__dropdown--panel">
              <View className="search-page__panel-section">
                <Text className="search-page__panel-label">酒店星级</Text>
                <View className="search-page__panel-tags">
                  {STAR_OPTIONS.map(s => (
                    <View key={s} onClick={() => setTempStars(ts => ts.includes(s) ? ts.filter(x => x !== s) : [...ts, s])}
                      className={`search-page__panel-tag ${tempStars.includes(s) ? 'search-page__panel-tag--active' : ''}`}>
                      <Text>{'★'.repeat(s)} {s}星</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="search-page__panel-section">
                <Text className="search-page__panel-label">价格区间</Text>
                <View className="search-page__panel-tags">
                  {PRICE_QUICK.map((r, i) => (
                    <View key={i} onClick={() => setTempPrice(r)}
                      className={`search-page__panel-tag ${tempPrice.label === r.label ? 'search-page__panel-tag--active' : ''}`}>
                      <Text>{r.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="search-page__panel-footer">
                <View className="search-page__panel-reset" onClick={resetStarPrice}><Text>重置</Text></View>
                <View className="search-page__panel-confirm" onClick={applyStarPrice}><Text>确认</Text></View>
              </View>
            </View>
          )}

          {/* ---- Location Dropdown Panel ---- */}
          {activeDropdown === 'location' && (
            <View className="search-page__dropdown search-page__dropdown--panel">
              <View className="search-page__panel-section">
                <Text className="search-page__panel-label">与我的距离（直线）</Text>
                <View className="search-page__panel-tags">
                  <View onClick={() => handleDistanceSelect(null)}
                    className={`search-page__panel-tag ${selectedDistance === null ? 'search-page__panel-tag--active' : ''}`}>
                    <Text>不限</Text>
                  </View>
                  {DISTANCE_OPTIONS.map(d => (
                    <View key={d} onClick={() => handleDistanceSelect(d)}
                      className={`search-page__panel-tag ${selectedDistance === d ? 'search-page__panel-tag--active' : ''}`}>
                      <Text>{d}km以内</Text>
                    </View>
                  ))}
                </View>
                <Text className="search-page__panel-tip">* 需授权位置权限</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Filter Chips */}
        <ScrollView scrollX className="search-page__chips-scroll" showScrollbar={false}>
          <View className="search-page__chips">
            {['4.7分以上', '20km以内', '高端型', '泳池', '4星级及以上'].map(chip => (
              <View key={chip} onClick={() => toggleChip(chip)}
                className={`search-page__chip ${activeChips.includes(chip) ? 'search-page__chip--active' : ''}`}>
                <Text>{chip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Backdrop for dropdowns */}
      {activeDropdown && <View className="search-page__backdrop" onClick={() => setActiveDropdown(null)} />}

      {/* ========== Map / List view ========== */}
      {isMapView ? (
        <View className="search-page__map-container">
          <Map style={{ width: '100%', height: 'calc(100vh - 150px)' }} longitude={mapCenter.longitude} latitude={mapCenter.latitude}
            scale={13} markers={mapMarkers as any} onMarkerTap={handleMarkerTap} showLocation onError={e => console.error('Map error', e)} />
          <View className="search-page__map-count-badge"><Text className="search-page__map-count-text">当前共 {sortedHotels.length} 家酒店</Text></View>
          <View className="search-page__map-list-fab" onClick={() => { setIsMapView(false); setSelectedHotel(null); }}>
            <Image src="https://api.iconify.design/lucide:list.svg?color=%23FF6B35" style={{ width: 16, height: 16 }} />
            <Text className="search-page__map-list-fab-text">回列表</Text>
          </View>
          {selectedHotel && (
            <View className="search-page__map-popup">
              <View className="search-page__map-popup-card" onClick={() => {
                let url = `/pages/hotel-details/index?id=${selectedHotel.hotel_id}`;
                if (searchState.check_in && searchState.check_out) url += `&check_in=${searchState.check_in}&check_out=${searchState.check_out}`;
                Taro.navigateTo({ url });
              }}>
                <Image src={selectedHotel.image_url || 'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?auto=format&fit=crop&w=400&q=80'} className="search-page__map-popup-img" mode="aspectFill" />
                <View className="search-page__map-popup-info">
                  <Text className="search-page__map-popup-name">{selectedHotel.name}</Text>
                  <View className="search-page__map-popup-rating">
                    <View className="search-page__hotel-score-badge"><Text>{selectedHotel.score || '4.0'}</Text></View>
                    <Text className="search-page__map-popup-reviews">{selectedHotel.remark?.substring(0, 16) || '舒适体验，品质之选'}...</Text>
                  </View>
                  <Text className="search-page__map-popup-addr">{selectedHotel.address}</Text>
                  <View className="search-page__map-popup-price-row">
                    <Text className="search-page__map-popup-price">¥{selectedHotel.min_price}<Text className="search-page__hotel-price-suffix">起/晚</Text></Text>
                    <View className="search-page__map-popup-arrow"><Text>›</Text></View>
                  </View>
                </View>
              </View>
              <View className="search-page__map-popup-close" onClick={() => setSelectedHotel(null)}><Text>✕</Text></View>
            </View>
          )}
        </View>
      ) : (
        <ScrollView scrollY className="search-page__main">
          {sortedHotels.length === 0 ? (
            <View className="search-page__empty">
              <Text className="search-page__empty-icon">🔍</Text>
              <Text className="search-page__empty-title">未找到符合条件的酒店</Text>
              <Text className="search-page__empty-text">试试调整搜索条件或清除筛选</Text>
              <View onClick={() => setKeyword('')} className="search-page__empty-clear-btn"><Text>清除关键词</Text></View>
            </View>
          ) : sortedHotels.map(hotel => {
            const originalPrice = hotel.original_price || hotel.min_price;
            const savings = originalPrice > hotel.min_price ? Math.floor(originalPrice - hotel.min_price) : 0;
            const reviewCount = hotel.real_reviews_count !== undefined ? hotel.real_reviews_count : (hotel.reviews || 0);
            let distText = '';
            if (userLocation && hotel.latitude && hotel.longitude) {
              const d = calcDistance(userLocation.lat, userLocation.lng, Number(hotel.latitude), Number(hotel.longitude));
              distText = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
            }
            return (
              <View key={hotel.hotel_id} className="search-page__hotel-card" onClick={() => {
                let url = `/pages/hotel-details/index?id=${hotel.hotel_id}`;
                if (searchState.check_in && searchState.check_out) url += `&check_in=${searchState.check_in}&check_out=${searchState.check_out}`;
                Taro.navigateTo({ url });
              }}>
                <View className="search-page__hotel-image-col">
                  <View className="search-page__hotel-image-wrapper">
                    <Image src={hotel.image_url || 'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?auto=format&fit=crop&w=400&q=80'} className="search-page__hotel-image" mode="aspectFill" />
                    <Text className="search-page__hotel-brand-tag">易宿酒店</Text>
                    <View className="search-page__hotel-play-btn"><Text className="search-page__hotel-play-icon">▶</Text></View>
                  </View>
                </View>
                <View className="search-page__hotel-content">
                  <View className="search-page__hotel-content-top">
                    <View className="search-page__hotel-name-row"><Text className="search-page__hotel-name">{hotel.name}</Text></View>
                    <View className="search-page__hotel-badges">
                      {hotel.hotel_type && HOTEL_TYPE_MAP[hotel.hotel_type] && (
                        <Text className={`search-page__hotel-badge ${BADGE_CLASS_MAP[HOTEL_TYPE_MAP[hotel.hotel_type].text] || ''}`}>{HOTEL_TYPE_MAP[hotel.hotel_type].type}</Text>
                      )}
                      {hotel.star_rating > 3 && (
                        <View className="search-page__hotel-preferred-badge">
                          <Text className="search-page__hotel-preferred-icon">⭐</Text>
                          <Text>{hotel.star_rating} 星级</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="search-page__hotel-rating-row">
                    <View className="search-page__hotel-score-badge"><Text>{hotel.score || '4.0'}</Text></View>
                    <Text className="search-page__hotel-score-label">{(hotel.score || 4.0) >= 4.5 ? '极好' : '好'}</Text>
                    <View className="search-page__hotel-divider-v" />
                    <Text className="search-page__hotel-reviews">{reviewCount} 条点评</Text>
                  </View>
                  <View><Text className="search-page__hotel-quote">{(hotel.remark || '舒适体验，品质之选').substring(0, 10)}{(hotel.remark || '').length > 10 ? '...' : ''}</Text></View>
                  <Text className="search-page__hotel-distance">{hotel.city_name} · {hotel.address}{distText ? ` · 距您${distText}` : ''}</Text>
                  <View className="search-page__hotel-features">
                    {(hotel.parsedTags && hotel.parsedTags.length > 0) ? hotel.parsedTags.slice(0, 3).map((tag: string, i: number) => (
                      <View key={i} className={`search-page__hotel-feature-tag ${tag === '升级房型' ? 'search-page__hotel-feature-tag--blue' : 'search-page__hotel-feature-tag--gray'}`}><Text>{tag}</Text></View>
                    )) : (<><View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--blue"><Text>优享</Text></View>
                      <View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--gray"><Text>免费停车</Text></View></>)}
                  </View>
                  <View className="search-page__hotel-price-row">
                    <Text className="search-page__hotel-stock">{hotel.left_stock !== undefined ? (hotel.left_stock <= 3 ? `仅剩 ${hotel.left_stock} 间` : '房源充足') : '有房'}</Text>
                    <View className="search-page__hotel-price-col">
                      {savings > 0 && (<View className="search-page__hotel-original-price-row"><Text className="search-page__hotel-original-price">¥{originalPrice}</Text><Text className="search-page__hotel-save-badge">省 ¥{savings}</Text></View>)}
                      <View className="search-page__hotel-current-price">
                        <Text className="search-page__hotel-currency">¥</Text>
                        <Text className="search-page__hotel-price-value">{hotel.min_price || 0}</Text>
                        <Text className="search-page__hotel-price-suffix">起/晚</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ height: '60px' }} />
        </ScrollView>
      )}

      {/* Pickers & Modals */}
      <CityPicker isOpen={isCityPickerOpen} currentCity={searchState.city_name || ''}
        onClose={() => setIsCityPickerOpen(false)}
        onSelect={city => { const u = { ...searchState, city_name: city }; setSearchState(u); setIsCityPickerOpen(false); fetchHotels(u); }}
      />
      <DatePicker isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)}
        startDate={searchState.check_in ? new Date(searchState.check_in) : new Date()}
        endDate={searchState.check_out ? new Date(searchState.check_out) : new Date()}
        onSelect={(s, e) => { const fmt = (d: Date) => d.toISOString().split('T')[0]; const u = { ...searchState, check_in: fmt(s), check_out: fmt(e) }; setSearchState(u); setIsDatePickerOpen(false); fetchHotels(u); }}
      />
      <SearchFilterModal isOpen={isMoreFilterOpen} initialValues={moreFilterValues}
        onClose={() => setIsMoreFilterOpen(false)} onConfirm={handleMoreFilterConfirm}
      />
    </View>
  );
};

export default Search;
