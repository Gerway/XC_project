import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import HotelCard from '../../components/HotelCard/HotelCard';
import { HOTELS } from '../../constants';
import './index.scss';

const Search: React.FC = () => {
  // Read search params from storage (set by Home page)
  const [keyword, setKeyword] = useState('');
  const [activeSort, setActiveSort] = useState('Recommended');

  useEffect(() => {
    try {
      const raw = Taro.getStorageSync('searchParams');
      if (raw) {
        const params = JSON.parse(raw);
        if (params.keyword) setKeyword(params.keyword);
      }
    } catch (e) {
      console.log('No search params found');
    }
  }, []);

  const sortOptions = ['Recommended', 'Price', 'Score', 'Distance'];

  const filteredHotels = useMemo(() => {
    let result = [...HOTELS];
    if (keyword) {
      const k = keyword.toLowerCase();
      result = result.filter(h =>
        h.name.toLowerCase().includes(k) ||
        h.address.toLowerCase().includes(k) ||
        h.tags.some(t => t.toLowerCase().includes(k))
      );
    }

    if (activeSort === 'Price') {
      result.sort((a, b) => a.min_price - b.min_price);
    } else if (activeSort === 'Score') {
      result.sort((a, b) => b.score - a.score);
    }

    return result;
  }, [keyword, activeSort]);

  return (
    <View className="search-page">
      {/* Header */}
      <View className="search-page__header">
        <View className="search-page__search-bar">
          <View className="search-page__back-btn" onClick={() => Taro.navigateBack()}>
            <Text>←</Text>
          </View>
          <View className="search-page__input-wrapper">
            <Text className="search-page__search-icon">🔍</Text>
            <Input
              className="search-page__input"
              value={keyword}
              onInput={e => setKeyword(e.detail.value)}
              placeholder="Search hotels..."
              focus
            />
            {keyword && (
              <View className="search-page__clear-btn" onClick={() => setKeyword('')}>
                <Text>✕</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sort Options */}
        <ScrollView scrollX className="search-page__filter-bar" showScrollbar={false}>
          <View className="search-page__sort-options">
            {sortOptions.map(option => (
              <View
                key={option}
                className={`search-page__sort-option ${activeSort === option ? 'search-page__sort-option--active' : ''}`}
                onClick={() => setActiveSort(option)}
              >
                <Text>{option}</Text>
                {activeSort === option && <Text className="search-page__sort-icon">▼</Text>}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Quick Filters */}
        <ScrollView scrollX className="search-page__quick-filters" showScrollbar={false}>
          <View className="search-page__quick-filters-inner">
            {['Free Cancel', 'Breakfast Included', 'Pay at Hotel', 'Instant Confirm'].map(filter => (
              <View key={filter} className="search-page__quick-filter-chip">
                <Text>{filter}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Hotel List */}
      <ScrollView scrollY className="search-page__list">
        <View className="search-page__list-inner">
          {filteredHotels.length > 0 ? (
            filteredHotels.map(hotel => (
              <HotelCard
                key={hotel.hotel_id}
                hotel={hotel}
                onClick={() => Taro.navigateTo({ url: `/pages/hotel-details/index?id=${hotel.hotel_id}` })}
              />
            ))
          ) : (
            <View className="search-page__empty">
              <Text className="search-page__empty-icon">🔍</Text>
              <Text className="search-page__empty-text">No hotels found</Text>
              <View className="search-page__empty-clear-btn" onClick={() => setKeyword('')}>
                <Text>Clear Search</Text>
              </View>
            </View>
          )}
          {/* TabBar Spacer */}
          <View style={{ height: '60px' }}></View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Search;
