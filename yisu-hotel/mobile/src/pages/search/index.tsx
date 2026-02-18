import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { HOTELS } from '../../constants';
import './index.scss';

interface SearchState {
  location: string;
  keyword: string;
  checkIn: number;
  checkOut: number;
  priceMin: number;
  priceMax: number;
  brands: string[];
  tab: string;
}

const BADGE_CLASS_MAP: Record<string, string> = {
  'Comfort': 'search-page__hotel-badge--purple',
  'Luxury': 'search-page__hotel-badge--orange',
  'Boutique': 'search-page__hotel-badge--blue',
};

const getHotelMeta = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
  // Read search params from Taro storage (set by Home page)
  const defaultState = useMemo<SearchState>(() => ({
    location: 'Chongqing',
    keyword: '',
    checkIn: Date.now(),
    checkOut: Date.now() + 86400000,
    priceMin: 0,
    priceMax: 1500,
    brands: [],
    tab: 'domestic',
  }), []);

  const [searchState, setSearchState] = useState<SearchState>(defaultState);

  // useDidShow fires every time this TabBar page becomes visible,
  // so search params from Home are always re-read on tab switch
  useDidShow(() => {
    try {
      const raw = Taro.getStorageSync('searchParams');
      if (raw) {
        const params = JSON.parse(raw);
        setSearchState({
          location: params.location || defaultState.location,
          keyword: params.keyword || '',
          checkIn: params.checkIn || defaultState.checkIn,
          checkOut: params.checkOut || defaultState.checkOut,
          priceMin: params.priceMin ?? 0,
          priceMax: params.priceMax ?? 1500,
          brands: params.brands || [],
          tab: params.tab || 'domestic',
        });
        setKeyword(params.keyword || '');
      }
    } catch (e) {
      console.log('No search params');
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
    const start = new Date(searchState.checkIn);
    const end = new Date(searchState.checkOut);
    const format = (d: Date) => `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    return `${format(start)} - ${format(end)}`;
  }, [searchState.checkIn, searchState.checkOut]);

  const hotelsWithMeta = useMemo(() => {
    return HOTELS.map(hotel => ({
      ...hotel,
      meta: getHotelMeta(hotel.hotel_id)
    }));
  }, []);

  const filteredHotels = useMemo(() => {
    return hotelsWithMeta.filter(hotel => {
      if (searchState.location && searchState.location !== 'All') {
        if (!hotel.address.toLowerCase().includes(searchState.location.toLowerCase())) {
          return false;
        }
      }
      if (keyword) {
        const k = keyword.toLowerCase();
        const matchesName = hotel.name.toLowerCase().includes(k);
        const matchesAddress = hotel.address.toLowerCase().includes(k);
        const matchesTags = hotel.tags.some(t => t.toLowerCase().includes(k));
        if (!matchesName && !matchesAddress && !matchesTags) return false;
      }
      const min = searchState.priceMin;
      const max = searchState.priceMax;
      if (hotel.min_price < min) return false;
      if (max < 1500 && hotel.min_price > max) return false;
      if (searchState.brands.length > 0) {
        const matchesBrand = searchState.brands.some(brand =>
          hotel.name.toLowerCase().includes(brand.toLowerCase())
        );
        if (!matchesBrand) return false;
      }
      return true;
    });
  }, [keyword, searchState, hotelsWithMeta]);

  const sortedHotels = useMemo(() => {
    const result = [...filteredHotels];
    switch (sortOption) {
      case 'distance':
        result.sort((a, b) => a.meta.distance - b.meta.distance);
        break;
      case 'score':
        result.sort((a, b) => b.score - a.score);
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
  }, [filteredHotels, sortOption]);

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
              <Text className="search-page__search-location">{searchState.location}</Text>
              <Text className="search-page__search-dates">{dateRangeDisplay}</Text>
            </View>

            <Input
              className="search-page__search-input"
              placeholder="Location / Hotel / Keyword"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
            />

            {keyword && (
              <View onClick={() => setKeyword('')} className="search-page__search-clear-btn">
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
            const meta = hotel.meta;
            const originalPrice = hotel.min_price + meta.originalPrice;

            return (
              <View
                key={hotel.hotel_id}
                className="search-page__hotel-card"
                onClick={() => Taro.navigateTo({ url: `/pages/hotel-details/index?id=${hotel.hotel_id}` })}
              >
                <View className="search-page__hotel-image-col">
                  <View className="search-page__hotel-image-wrapper">
                    <Image src={hotel.image_url} className="search-page__hotel-image" mode="aspectFill" />
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
                      <Text className={`search-page__hotel-badge ${BADGE_CLASS_MAP[meta.badge.text] || ''}`}>{meta.badge.text}</Text>
                      <View className="search-page__hotel-preferred-badge">
                        <Text className="search-page__hotel-preferred-icon">⭐</Text>
                        <Text>Preferred</Text>
                      </View>
                    </View>
                  </View>

                  <View className="search-page__hotel-rating-row">
                    <View className="search-page__hotel-score-badge">
                      <Text>{hotel.score}</Text>
                    </View>
                    <Text className="search-page__hotel-score-label">Superb</Text>
                    <View className="search-page__hotel-divider-v"></View>
                    <Text className="search-page__hotel-reviews">{hotel.reviews_count} Reviews</Text>
                    <Text className="search-page__hotel-favs">{meta.collections} Favs</Text>
                  </View>

                  <View>
                    <Text className="search-page__hotel-quote">{meta.quote}</Text>
                  </View>

                  <Text className="search-page__hotel-distance">
                    Straight {meta.distance}m · Near {hotel.address.split(' ').slice(1, 3).join(' ')}
                  </Text>

                  <View className="search-page__hotel-features">
                    <View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--blue">
                      <Text className="search-page__hotel-feature-icon">💎</Text>
                      <Text>Upgrade</Text>
                    </View>
                    <View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--gray">
                      <Text>Free Parking</Text>
                    </View>
                    <View className="search-page__hotel-feature-tag search-page__hotel-feature-tag--gray">
                      <Text>Smart Key</Text>
                    </View>
                  </View>

                  <View className="search-page__hotel-price-row">
                    <Text className="search-page__hotel-stock">Only {meta.leftStock} left</Text>
                    <View className="search-page__hotel-price-col">
                      <View className="search-page__hotel-original-price-row">
                        <Text className="search-page__hotel-original-price">¥{originalPrice}</Text>
                        <Text className="search-page__hotel-save-badge">Save {meta.originalPrice}</Text>
                      </View>
                      <View className="search-page__hotel-current-price">
                        <Text className="search-page__hotel-currency">¥</Text>
                        <Text className="search-page__hotel-price-value">{hotel.min_price}</Text>
                        <Text className="search-page__hotel-price-suffix">up</Text>
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
      </ScrollView>
    </View>
  );
};

export default Search;
