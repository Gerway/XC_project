import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import DatePicker from '../../components/DatePicker/DatePicker';
import FilterModal from '../../components/FilterModal/FilterModal';
import { useAppContext } from '../../context';

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
  const [activeTab, setActiveTab] = useState('domestic');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const hasFilter = priceRange[0] > 0 || priceRange[1] < 1000 || selectedBrands.length > 0;

  const tabs = [
    { key: 'domestic', label: 'Domestic' },
    { key: 'international', label: 'International' },
    { key: 'hourly', label: 'Hourly' },
    { key: 'homestay', label: 'Homestay' },
  ];

  const tags = ['Jiefangbei', 'Hongyadong', 'Guanyin Bridge', 'Airport'];

  const categories = [
    { name: 'Coupons', icon: '🎫', color: 'red' },
    { name: 'Favorites', icon: '❤️', color: 'orange' },
    { name: 'History', icon: '🕐', color: 'blue' },
    { name: 'Flights', icon: '✈️', color: 'green' },
    { name: 'Trains', icon: '🚄', color: 'purple' },
  ];

  const handleSearch = () => {
    // Store search params for the search page to read
    const searchParams = {
      keyword,
      location,
      checkIn: dates.start.getTime(),
      checkOut: dates.end.getTime(),
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      brands: selectedBrands,
      tab: activeTab,
    };
    Taro.setStorageSync('searchParams', JSON.stringify(searchParams));
    Taro.switchTab({
      url: '/pages/search/index'
    });
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setDates({ start, end });
  };

  const handleFilterConfirm = (range: [number, number], brands: string[]) => {
    setPriceRange(range);
    setSelectedBrands(brands);
  };

  const handleTagClick = (tag: string) => {
    setKeyword(prev => {
      if (prev.includes(tag)) return prev;
      return prev ? `${prev} ${tag}` : tag;
    });
  };

  const navigateToProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' });
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getWeekDay = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const nightCount = Math.round((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View className="home">
      {/* Header */}
      <View className="home__header">
        <View className="home__header-content">
          <View className="home__logo-section">
            <View className="home__logo">
              <Text className="home__logo-letter">Y</Text>
            </View>
            <Text className="home__brand-name">YiSu</Text>
          </View>
          <View className="home__avatar-btn" onClick={navigateToProfile}>
            <Image
              src={user?.avatar || 'https://ui-avatars.com/api/?name=GU&background=f0c040&color=fff&size=80'}
              className="home__avatar-img"
              mode="aspectFill"
            />
          </View>
        </View>
      </View>

      <ScrollView scrollY className="home__scroll-container">
        <View className="home__content">
          {/* Search Box */}
          <View className="home__search-box">
            {/* Tabs */}
            <View className="home__tabs">
              {tabs.map(tab => (
                <Text
                  key={tab.key}
                  className={`home__tab-btn ${activeTab === tab.key ? 'home__tab-btn--active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </Text>
              ))}
            </View>

            {/* Location & Search */}
            <View className="home__location-row">
              <View className="home__location-btn">
                <Text className="home__location-text">{location}</Text>
                <Text className="home__location-icon">▼</Text>
              </View>
              <View className="home__divider-v"></View>
              <View className="home__search-input-wrapper">
                <Input
                  className="home__search-input"
                  value={keyword}
                  onInput={e => setKeyword(e.detail.value)}
                  placeholder="Search"
                />
                <View className="home__search-locate-btn">
                  <Text>◎</Text>
                </View>
              </View>
            </View>

            {/* Date Selector */}
            <View className="home__date-selector" onClick={() => setIsDatePickerOpen(true)}>
              <View className="home__date-col">
                <Text className="home__date-label">Check-in</Text>
                <View className="home__date-value-row">
                  <Text className="home__date-value">{formatDate(dates.start)}</Text>
                  <Text className="home__date-day">{isToday(dates.start) ? 'Today' : getWeekDay(dates.start)}</Text>
                </View>
              </View>
              <View className="home__nights-badge">
                <Text>{nightCount} Night{nightCount > 1 ? 's' : ''}</Text>
              </View>
              <View className="home__date-col home__date-col--right">
                <Text className="home__date-label">Check-out</Text>
                <View className="home__date-value-row home__date-value-row--right">
                  <Text className="home__date-value">{formatDate(dates.end)}</Text>
                  <Text className="home__date-day">{getWeekDay(dates.end)}</Text>
                </View>
              </View>
            </View>

            {/* Filter Row */}
            <View className="home__filter-row" onClick={() => setIsFilterOpen(true)}>
              <View className="home__filter-info">
                {hasFilter && <View className="home__filter-dot"></View>}
                <Text className={`home__filter-text ${hasFilter ? 'home__filter-text--active' : ''}`}>
                  {hasFilter
                    ? `¥${priceRange[0]}-${priceRange[1]}${selectedBrands.length > 0 ? ` · ${selectedBrands.length} brands` : ''}`
                    : 'Price & Star Rating'
                  }
                </Text>
              </View>
              <Text className={`home__filter-arrow ${hasFilter ? 'home__filter-arrow--active' : ''}`}>›</Text>
            </View>

            {/* Tags */}
            <View className="home__tags">
              {tags.map(tag => (
                <Text
                  key={tag}
                  className={`home__tag-btn ${keyword.includes(tag) ? 'home__tag-btn--active' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Text>
              ))}
            </View>

            {/* Search Button */}
            <Button className="home__search-btn" onClick={handleSearch}>
              Search Hotels
            </Button>
          </View>

          {/* Categories */}
          <View className="home__categories-grid">
            {categories.map(cat => (
              <View key={cat.name} className="home__category-item">
                <View className={`home__category-icon-wrapper home__category-icon-wrapper--${cat.color}`}>
                  <Text className="home__category-emoji">{cat.icon}</Text>
                </View>
                <Text className="home__category-name">{cat.name}</Text>
              </View>
            ))}
          </View>

          {/* Bottom Spacer for TabBar */}
          <View style={{ height: '60px' }}></View>
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
        initialRange={priceRange}
        initialBrands={selectedBrands}
      />
    </View>
  );
};

export default Home;
