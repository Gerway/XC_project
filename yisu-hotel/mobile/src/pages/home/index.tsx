import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import HotelCard from '../../components/HotelCard/HotelCard';
import DatePicker from '../../components/DatePicker/DatePicker';
import FilterModal from '../../components/FilterModal/FilterModal';
import { useAppContext } from '../../context';
import { HOTELS } from '../../constants';

import './index.scss';

const Home: React.FC = () => {
  const { user } = useAppContext();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('Chongqing');
  const [dates, setDates] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = [
    { name: 'Hotels', icon: 'hotel' },
    { name: 'Homestays', icon: 'cottage' },
    { name: 'Flight + Hotel', icon: 'flight' },
    { name: 'Hourly', icon: 'schedule' },
    { name: 'Guide', icon: 'map' },
  ];

  const recommendedHotels = useMemo(() => {
    return HOTELS.filter(h => h.score >= 4.8);
  }, []);

  const handleSearch = () => {
    // Navigate with params
    // Note: Dates object is complex, better to pass timestamp or store in global/storage
    // For tutorial simplicity, we pass minimal params
    Taro.navigateTo({
      url: `/pages/search/index?keyword=${keyword}&location=${location}`
    });
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setDates({ start, end });
  };

  const handleFilterConfirm = (range: [number, number], brands: string[]) => {
    // In a real app, you might apply this filter to current view or pass to search
    console.log('Filter:', range, brands);
  };

  const navigateToProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' });
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}.${date.getDate()}`;
  };

  const getWeekDay = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const nightCount = Math.round((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View className="home">
      {/* Header / Banner */}
      <View className="home__header">
        <View className="home__header-content">
          <View className="home__logo">
            <Text className="home__logo-text">YiSu</Text>
            <Text className="home__logo-dot">.</Text>
          </View>
          <View className="home__user-actions">
            {/* Taro doesn't support 'download' app easily, omit or change to 'Help' */}
            <View className="home__action-btn">
              <Text className="material-symbols-outlined">help_outline</Text>
            </View>
            <View className="home__avatar-container" onClick={navigateToProfile}>
              <Image
                src={user?.avatar || 'https://ui-avatars.com/api/?name=Guest&background=random'}
                className="home__avatar"
              />
              {user && <View className="home__status-dot"></View>}
            </View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="home__scroll-container">
        <View className="home__content">
          <Text className="home__hero-title">Find your perfect place to stay</Text>

          {/* Search Box */}
          <View className="home__search-box">
            {/* Tabs */}
            <View className="home__search-tabs">
              <Text className="home__search-tab home__search-tab--active">Overnight</Text>
              <Text className="home__search-tab">Hourly</Text>
            </View>

            {/* Location */}
            <View className="home__search-row">
              <View className="home__search-field home__search-field--location">
                <Text className="home__search-label">Location</Text>
                <View className="home__input-wrapper">
                  <Text className="material-symbols-outlined home__field-icon">location_on</Text>
                  <Input
                    className="home__search-input"
                    value={location}
                    onInput={e => setLocation(e.detail.value)}
                    placeholder="Where to?"
                  />
                </View>
              </View>
              <View className="home__location-btn">
                <Text className="material-symbols-outlined">my_location</Text>
                <Text className="home__location-text">Current</Text>
              </View>
            </View>

            {/* Date Picker Trigger */}
            <View className="home__search-row" onClick={() => setIsDatePickerOpen(true)}>
              <View className="home__search-field">
                <Text className="home__search-label">Check-in</Text>
                <View className="home__date-display">
                  <Text className="home__date-value">{formatDate(dates.start)}</Text>
                  <Text className="home__date-weekday">{getWeekDay(dates.start)}</Text>
                </View>
              </View>
              <View className="home__night-count">
                <Text>{nightCount} night{nightCount > 1 ? 's' : ''}</Text>
              </View>
              <View className="home__search-field">
                <Text className="home__search-label">Check-out</Text>
                <View className="home__date-display">
                  <Text className="home__date-value">{formatDate(dates.end)}</Text>
                  <Text className="home__date-weekday">{getWeekDay(dates.end)}</Text>
                </View>
              </View>
            </View>

            <View className="home__divider"></View>

            {/* Keyword & Filter */}
            <View className="home__search-row">
              <View className="home__search-field" style={{ flex: 1 }}>
                <Text className="home__search-label">Keyword / Hotel / Brand</Text>
                <Input
                  className="home__search-input"
                  value={keyword}
                  onInput={e => setKeyword(e.detail.value)}
                  placeholder="Prices, business district, brand"
                />
              </View>
              <View className="home__filter-btn" onClick={() => setIsFilterOpen(true)}>
                <Text className="material-symbols-outlined">tune</Text>
              </View>
            </View>

            <Button className="home__search-btn" onClick={handleSearch}>
              Search Hotels
            </Button>
          </View>

          {/* Categories */}
          <ScrollView scrollX className="home__categories" showScrollbar={false}>
            {categories.map(cat => (
              <View key={cat.name} className="home__category-item">
                <View className="home__category-icon">
                  <Text className="material-symbols-outlined">{cat.icon}</Text>
                </View>
                <Text className="home__category-name">{cat.name}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Recommendations */}
          <View className="home__section">
            <View className="home__section-header">
              <Text className="home__section-title">Recommended for you</Text>
              <Text className="home__section-more">See All</Text>
            </View>
            <View className="home__hotel-list">
              {recommendedHotels.map(hotel => (
                <HotelCard
                  key={hotel.hotel_id}
                  hotel={hotel}
                  onClick={() => Taro.navigateTo({ url: `/pages/hotel-details/index?id=${hotel.hotel_id}` })}
                />
              ))}
            </View>
          </View>

          {/* Spacer for TabBar */}
          <View style={{ height: '120px' }}></View>
        </View>
      </ScrollView>

      <DatePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={handleDateSelect}
        startDate={dates.start}
        endDate={dates.end}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onConfirm={handleFilterConfirm}
        initialRange={[0, 1000]}
        initialBrands={[]}
      />
    </View>
  );
};

export default Home;
