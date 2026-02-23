import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { hotelApi, SearchHotelsParams, Hotel } from '../../api/hotel';
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

const getHotelMeta = (id: string | number) => {
  const hash = id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const quotes = [
    "Enjoy private cinema near the pedestrian street",
    "Smart facilities with high cost performance",
    "Quiet courtyard with garden view",
    "Excellent service and great location",
    "Perfect for family trips with kids"
  ];
  const badges = [
    { text: 'Comfort' },
    { text: 'Luxury' },
    { text: 'Boutique' }
  ];

  return {
    quote: quotes[hash % quotes.length],
    collections: (hash * 13) % 2000 + 500,
    badge: badges[hash % badges.length],
    distance: ((hash % 15) + 5) * 100,
    originalPrice: Math.floor((hash % 50) + 50),
    leftStock: (hash % 5) + 1
  };
};

const Search: React.FC = () => {
  // Date format utility
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const defaultState = useMemo<SearchHotelsParams>(() => ({
    city_name: 'Chongqing',
    keyword: '',
    check_in: getTodayStr(),
    check_out: getTomorrowStr(),
    min_price: 0,
    max_price: 1500,
    star_rating: [],
    room_type: 1,
  }), []);

  const [searchState, setSearchState] = useState<SearchHotelsParams>(defaultState);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  const fetchHotels = async (params: SearchHotelsParams) => {
    Taro.showLoading({ title: 'Searching...' });
    try {
      const res = await hotelApi.searchHotels(params);
      setHotels(res.data || []);
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: 'Failed to search', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  useDidShow(() => {
    try {
      const raw = Taro.getStorageSync('searchParams');
      if (raw) {
        const params: SearchHotelsParams = JSON.parse(raw);
        const newState = {
          city_name: params.city_name || defaultState.city_name,
          keyword: params.keyword || '',
          check_in: params.check_in || defaultState.check_in,
          check_out: params.check_out || defaultState.check_out,
          min_price: params.min_price ?? 0,
          max_price: params.max_price ?? 1500,
          star_rating: params.star_rating || [],
          room_type: params.room_type || 1,
        };
        setSearchState(newState);
        setKeyword(newState.keyword || '');
        fetchHotels(newState);
      } else {
        fetchHotels(defaultState);
      }
    } catch (e) {
      console.log('No search params');
      fetchHotels(defaultState);
    }
  });

  const [keyword, setKeyword] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>('recommended');

  const sortOptions = [
    { label: 'Recommended Sort', value: 'recommended' },
    { label: 'Distance Sort', value: 'distance' },
    { label: 'Best Rating', value: 'score' },
    { label: 'Lowest Price', value: 'price_asc' },
    { label: 'Highest Price', value: 'price_desc' },
  ];

  const dateRangeDisplay = useMemo(() => {
    if (!searchState.check_in || !searchState.check_out) return '';
    const start = new Date(searchState.check_in);
    const end = new Date(searchState.check_out);
    const format = (d: Date) => `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    return `${format(start)} - ${format(end)}`;
  }, [searchState.check_in, searchState.check_out]);

  const hotelsWithMeta = useMemo(() => {
    return hotels.map(hotel => {
      // Parse tags if it's a JSON string, or just use as is if already an array/empty
      let parsedTags: string[] = [];
      if (typeof hotel.tags === 'string') {
        try {
          parsedTags = JSON.parse(hotel.tags);
        } catch (e) { /* ignore */ }
      } else if (Array.isArray(hotel.tags)) {
        parsedTags = hotel.tags;
      }
      return {
        ...hotel,
        parsedTags,
        meta: getHotelMeta(hotel.hotel_id)
      }
    });
  }, [hotels]);

  const sortedHotels = useMemo(() => {
    const result = [...hotelsWithMeta];
    switch (sortOption) {
      case 'distance':
        // Assuming we will eventually sort by real distance if we had geocoding.
        break;
      case 'score':
        result.sort((a, b: any) => (b.score || 0) - (a.score || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => a.min_price - b.min_price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.min_price - a.min_price);
        break;
      default:
        break;
    }
    return result;
  }, [hotelsWithMeta, sortOption]);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.value === sortOption);
    return option ? option.label.split(' ')[0] : 'Sort';
  };

  return (
    <View className="search-page">
      <View className="search-page__header">
        <View className="search-page__top-bar">
          <View
            onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
            className="search-page__back-btn"
          >
            <Text className="search-page__back-icon">‹</Text>
          </View>

          <View className="search-page__search-pill">
            <View className="search-page__search-info">
              <Text className="search-page__search-location">{searchState.city_name || 'All'}</Text>
              <Text className="search-page__search-dates">{dateRangeDisplay}</Text>
            </View>

            <Input
              className="search-page__search-input"
              placeholder="Location / Hotel / Keyword"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              onConfirm={() => {
                // If the user types a new keyword and hits enter, manually re-trigger API
                const updated = { ...searchState, keyword };
                setSearchState(updated);
                fetchHotels(updated);
              }}
            />

            {keyword && (
              <View onClick={() => {
                setKeyword('');
                const updated = { ...searchState, keyword: '' };
                setSearchState(updated);
                fetchHotels(updated);
              }} className="search-page__search-clear-btn">
                <Text className="search-page__search-clear-icon">✕</Text>
              </View>
            )}
          </View>

          <View className="search-page__map-btn">
            <View className="search-page__map-icon-wrapper">
              <Text className="search-page__map-icon">🗺</Text>
            </View>
            <Text className="search-page__map-label">Map</Text>
          </View>
        </View>

        {/* Filter Bar */}
        <View className="search-page__filter-bar">
          <View className="search-page__filter-bar-inner">
            <View
              onClick={() => toggleDropdown('sort')}
              className="search-page__sort-btn"
            >
              <Text>{sortOption === 'recommended' ? 'Sort' : getSortLabel()}</Text>
              <Text className={`search-page__sort-arrow ${activeDropdown === 'sort' ? 'search-page__sort-arrow--open' : ''}`}>▼</Text>
            </View>

            {['Price/Star', 'Location', 'More'].map(label => (
              <View
                key={label}
                onClick={() => toggleDropdown(label)}
                className={`search-page__filter-btn ${activeDropdown === label ? 'search-page__filter-btn--active' : ''}`}
              >
                <Text>{label}</Text>
                <Text className={`search-page__filter-arrow ${activeDropdown === label ? 'search-page__filter-arrow--open' : ''}`}>▼</Text>
              </View>
            ))}
          </View>

          {activeDropdown === 'sort' && (
            <View className="search-page__dropdown">
              <View className="search-page__dropdown-list">
                {sortOptions.map(opt => (
                  <View
                    key={opt.value}
                    onClick={() => { setSortOption(opt.value); setActiveDropdown(null); }}
                    className={`search-page__dropdown-option ${sortOption === opt.value ? 'search-page__dropdown-option--active' : ''}`}
                  >
                    <Text>{opt.label}</Text>
                    {sortOption === opt.value && <Text className="search-page__dropdown-check-icon">✓</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeDropdown && activeDropdown !== 'sort' && (
            <View className="search-page__dropdown search-page__dropdown-placeholder">
              <Text className="search-page__dropdown-placeholder-text">Filter for {activeDropdown} coming soon...</Text>
            </View>
          )}
        </View>

        {/* Quick Filter Chips */}
        <ScrollView scrollX className="search-page__chips-scroll" showScrollbar={false}>
          <View className="search-page__chips">
            <View className="search-page__chip search-page__chip--special">
              <Text>Newcomer Special</Text>
            </View>
            <View className="search-page__chip"><Text>Hotel Packages</Text></View>
            <View className="search-page__chip"><Text>4.7+ Rating</Text></View>
            <View className="search-page__chip"><Text>Free Cancellation</Text></View>
            <View className="search-page__chip"><Text>Instant Confirm</Text></View>
            <View className="search-page__chip"><Text>Pay at Hotel</Text></View>
          </View>
        </ScrollView>
      </View>

      {activeDropdown && (
        <View
          className="search-page__backdrop"
          onClick={() => setActiveDropdown(null)}
        ></View>
      )}

      <ScrollView scrollY className="search-page__main">
        {sortedHotels.length === 0 ? (
          <View className="search-page__empty">
            <Text className="search-page__empty-icon">🔍</Text>
            <Text className="search-page__empty-title">No hotels found</Text>
            <Text className="search-page__empty-text">Try adjusting your search or filters</Text>
            <View onClick={() => setKeyword('')} className="search-page__empty-clear-btn">
              <Text>Clear Keyword</Text>
            </View>
          </View>
        ) : (
          sortedHotels.map((hotel) => {
            const originalPrice = hotel.original_price || hotel.min_price;
            const savings = originalPrice > hotel.min_price ? Math.floor(originalPrice - hotel.min_price) : 0;
            const reviewCount = hotel.real_reviews_count !== undefined ? hotel.real_reviews_count : (hotel.reviews || 0);

            return (
              <View
                key={hotel.hotel_id}
                className="search-page__hotel-card"
                onClick={() => {
                  let url = `/pages/hotel-details/index?id=${hotel.hotel_id}`;
                  if (searchState.check_in && searchState.check_out) {
                    url += `&check_in=${searchState.check_in}&check_out=${searchState.check_out}`;
                  }
                  Taro.navigateTo({ url });
                }}
              >
                <View className="search-page__hotel-image-col">
                  <View className="search-page__hotel-image-wrapper">
                    <Image src={hotel.image_url || 'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?auto=format&fit=crop&w=400&q=80'} className="search-page__hotel-image" mode="aspectFill" />
                    <Text className="search-page__hotel-brand-tag">YiSu Hotel</Text>
                    <View className="search-page__hotel-play-btn">
                      <Text className="search-page__hotel-play-icon">▶</Text>
                    </View>
                  </View>
                </View>

                <View className="search-page__hotel-content">
                  <View className="search-page__hotel-content-top">
                    <View className="search-page__hotel-name-row">
                      <Text className="search-page__hotel-name">{hotel.name}</Text>
                    </View>
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
                    <View className="search-page__hotel-score-badge">
                      <Text>{hotel.score || '4.0'}</Text>
                    </View>
                    <Text className="search-page__hotel-score-label">{(hotel.score || 4.0) >= 4.5 ? '极好' : '好'}</Text>
                    <View className="search-page__hotel-divider-v"></View>
                    <Text className="search-page__hotel-reviews">{reviewCount} 条点评</Text>
                  </View>

                  <View>
                    <Text className="search-page__hotel-quote">
                      {(hotel.remark || '舒适体验，品质之选').length > 10
                        ? (hotel.remark || '舒适体验，品质之选').substring(0, 10) + '...'
                        : (hotel.remark || '舒适体验，品质之选')}
                    </Text>
                  </View>

                  <Text className="search-page__hotel-distance">
                    {hotel.city_name} · {hotel.address}
                  </Text>

                  <View className="search-page__hotel-features">
                    {(hotel.parsedTags && hotel.parsedTags.length > 0) ? hotel.parsedTags.slice(0, 3).map((tag: string, i: number) => (
                      <View key={i} className={`search-page__hotel-feature-tag ${tag === '升级房型' ? 'search-page__hotel-feature-tag--blue' : 'search-page__hotel-feature-tag--gray'}`}>
                        {tag === '升级房型' && <Text className="search-page__hotel-feature-icon">💎</Text>}
                        <Text>{tag}</Text>
                      </View>
                    )) : (
                      <>
                        <View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--blue">
                          <Text className="search-page__hotel-feature-icon">💎</Text>
                          <Text>优享</Text>
                        </View>
                        <View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--gray">
                          <Text>免费停车</Text>
                        </View>
                      </>
                    )}
                  </View>

                  <View className="search-page__hotel-price-row">
                    <Text className="search-page__hotel-stock">
                      {hotel.left_stock !== undefined
                        ? (hotel.left_stock <= 3 ? `仅剩 ${hotel.left_stock} 间` : '房源充足')
                        : '有房'}
                    </Text>
                    <View className="search-page__hotel-price-col">
                      {savings > 0 && (
                        <View className="search-page__hotel-original-price-row">
                          <Text className="search-page__hotel-original-price">¥{originalPrice}</Text>
                          <Text className="search-page__hotel-save-badge">省 ¥{savings}</Text>
                        </View>
                      )}
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
          })
        )}
        {/* TabBar bottom spacer */}
        <View style={{ height: '60px' }}></View>
      </ScrollView >
    </View >
  );
};

export default Search;
