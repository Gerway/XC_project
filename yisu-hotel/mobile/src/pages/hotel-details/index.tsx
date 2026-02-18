import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { HOTELS, ROOMS, MOCK_USER } from '../../constants';
import { Room, Order, OrderStatus } from '../../../types/types';
import './index.scss';

const HotelDetails: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || 'h_1';
  const hotel = HOTELS.find(h => h.hotel_id === id);
  const rooms = id && ROOMS[id] ? ROOMS[id] : ROOMS['h_1'];

  const [bookingType, setBookingType] = useState<'Daily' | 'Hourly'>('Daily');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Try to read dates from storage (set by search page)
  const [dates, setDates] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    try {
      const raw = Taro.getStorageSync('searchParams');
      if (raw) {
        const params = JSON.parse(raw);
        if (params.checkIn && params.checkOut) {
          return {
            start: new Date(params.checkIn),
            end: new Date(params.checkOut)
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { start: today, end: tomorrow };
  });

  if (!hotel) {
    return (
      <View className="hotel-details">
        <Text>Hotel not found</Text>
      </View>
    );
  }

  const handleBook = (room: Room) => {
    // 1. Create PENDING order immediately
    const nights = Math.max(1, Math.round((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPrice = room.price * nights;

    const newOrder: Order = {
      order_id: `o_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: MOCK_USER.user_id,
      hotel_id: hotel.hotel_id,
      hotel_name: hotel.name,
      hotel_image: hotel.image_url,
      room_id: room.room_id,
      room_name: room.name,
      check_in: dates.start.toISOString().split('T')[0],
      check_out: dates.end.toISOString().split('T')[0],
      nights: nights,
      total_price: totalPrice,
      real_pay: totalPrice, // Initial price, might change with coupons/breakfast
      status: OrderStatus.PENDING,
      created_at: new Date().toISOString(),
      guest_name: '',
      guest_phone: ''
    };

    // 2. Save to storage
    try {
      const existing = Taro.getStorageSync('orders');
      const orders = existing ? JSON.parse(existing) : [];
      orders.unshift(newOrder); // Add to top
      Taro.setStorageSync('orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to create order', e);
    }

    // 3. Store booking info for UI rendering (Hotel/Room details)
    Taro.setStorageSync('bookingInfo', JSON.stringify({
      hotel,
      room,
      dates: { start: dates.start.getTime(), end: dates.end.getTime() }
    }));

    // 4. Navigate with orderId
    Taro.navigateTo({ url: `/pages/booking/index?orderId=${newOrder.order_id}` });
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const nights = Math.max(1, Math.round((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <ScrollView scrollY className="hotel-details">
      {/* --- Hero Image Section --- */}
      <View className="hotel-details__hero">
        <Image src={hotel.image_url} className="hotel-details__hero-bg" mode="aspectFill" />
        <View className="hotel-details__hero-gradient"></View>

        <View className="hotel-details__top-nav">
          <View onClick={() => Taro.navigateBack()} className="hotel-details__nav-btn">
            <Text className="hotel-details__nav-btn-icon">‹</Text>
          </View>
          <View className="hotel-details__nav-actions">
            <View className="hotel-details__nav-btn">
              <Text className="hotel-details__nav-btn-icon">♡</Text>
            </View>
            <View className="hotel-details__nav-btn">
              <Text className="hotel-details__nav-btn-icon">↗</Text>
            </View>
            <View className="hotel-details__nav-btn">
              <Text className="hotel-details__nav-btn-icon">⋯</Text>
            </View>
          </View>
        </View>

        <View className="hotel-details__image-counter">
          <Text className="hotel-details__image-counter-icon">🖼</Text>
          <Text>1/42</Text>
        </View>

        <View className="hotel-details__hero-actions">
          <View className="hotel-details__hero-action-btn hotel-details__hero-action-btn--primary">
            <Text>Exterior</Text>
          </View>
          <View className="hotel-details__hero-action-btn hotel-details__hero-action-btn--secondary">
            <Text>Rooms</Text>
          </View>
          <View className="hotel-details__hero-action-btn hotel-details__hero-action-btn--secondary">
            <Text>Dining</Text>
          </View>
        </View>
      </View>

      {/* --- Main Content --- */}
      <View className="hotel-details__main">
        <View>
          <Text className="hotel-details__title">{hotel.name}</Text>
          <View className="hotel-details__meta">
            <Text className="hotel-details__tag-badge">{hotel.tags[0] || 'Luxury'}</Text>
            <Text>Opened 2015</Text>
            <View className="hotel-details__dot"></View>
            <Text>Renovated 2021</Text>
          </View>
        </View>

        {/* Ranking Banners */}
        <View className="hotel-details__rankings">
          <View className="hotel-details__ranking-banner hotel-details__ranking-banner--orange">
            <View className="hotel-details__ranking-info">
              <Text className="hotel-details__ranking-icon hotel-details__ranking-icon--orange">🏆</Text>
              <Text className="hotel-details__ranking-text hotel-details__ranking-text--orange">#1 in Quiet Hotels Recommendation</Text>
            </View>
            <Text className="hotel-details__ranking-arrow hotel-details__ranking-arrow--orange">›</Text>
          </View>
          <View className="hotel-details__ranking-banner hotel-details__ranking-banner--yellow">
            <View className="hotel-details__ranking-info">
              <Text className="hotel-details__ranking-icon hotel-details__ranking-icon--yellow">🏅</Text>
              <Text className="hotel-details__ranking-text hotel-details__ranking-text--yellow">Top 4 Travelers' Choice 2024</Text>
            </View>
            <Text className="hotel-details__ranking-arrow hotel-details__ranking-arrow--yellow">›</Text>
          </View>
        </View>

        {/* Score & Map Row */}
        <View className="hotel-details__score-map-row">
          <View className="hotel-details__score-card">
            <View className="hotel-details__score-top">
              <Text className="hotel-details__score-number">{hotel.score}</Text>
              <Text className="hotel-details__score-label">Great</Text>
            </View>
            <View className="hotel-details__score-reviews">
              <Text>{hotel.reviews_count} Reviews ›</Text>
            </View>
            <Text className="hotel-details__score-subtitle">Cleanliness 4.9 · Service 4.8</Text>
          </View>

          <View className="hotel-details__map-card">
            <View className="hotel-details__map-info">
              <Text className="hotel-details__map-address">{hotel.address}</Text>
              <Text className="hotel-details__map-distance">0.5km from center</Text>
            </View>
            <View className="hotel-details__map-icon-wrapper">
              <Text className="hotel-details__map-icon">📍</Text>
            </View>
          </View>
        </View>

        {/* Coupon Row */}
        <View className="hotel-details__coupon-row">
          <View className="hotel-details__coupon-pills">
            <Text className="hotel-details__coupon-label">Coupons</Text>
            <Text className="hotel-details__coupon-pill">15% Off</Text>
            <Text className="hotel-details__coupon-pill">$50 Voucher</Text>
          </View>
          <View className="hotel-details__coupon-claim">
            <Text>Claim ›</Text>
          </View>
        </View>
      </View>

      {/* --- Sticky Tabs & Date --- */}
      <View className="hotel-details__sticky-section">
        <View className="hotel-details__date-bar">
          <View className="hotel-details__date-picker-trigger" onClick={() => setShowDatePicker(!showDatePicker)}>
            <View>
              <Text className="hotel-details__date-range-text">
                {formatDate(dates.start)} - {formatDate(dates.end)}
              </Text>
            </View>
            <View className="hotel-details__nights-chip">
              <Text>{nights} Night{nights > 1 ? 's' : ''}</Text>
              <Text className="hotel-details__nights-chip-icon">📅</Text>
            </View>
          </View>
          <View className="hotel-details__booking-type-toggle">
            <View
              className={`hotel-details__booking-type-btn ${bookingType === 'Daily' ? 'hotel-details__booking-type-btn--active' : ''}`}
              onClick={() => setBookingType('Daily')}
            >
              <Text>Daily</Text>
            </View>
            <View
              className={`hotel-details__booking-type-btn ${bookingType === 'Hourly' ? 'hotel-details__booking-type-btn--active' : ''}`}
              onClick={() => setBookingType('Hourly')}
            >
              <Text>Hourly</Text>
            </View>
          </View>
        </View>

        <ScrollView scrollX className="hotel-details__filter-chips-scroll" showScrollbar={false}>
          <View className="hotel-details__filter-chips">
            {['All Rooms', 'Free Cancellation', 'Breakfast Included', 'Pay at Hotel'].map((filter, i) => (
              <View key={filter} className={`hotel-details__filter-chip ${i === 0 ? 'hotel-details__filter-chip--active' : ''}`}>
                <Text>{filter}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* --- Room List --- */}
      <View className="hotel-details__room-list">
        {rooms.map((room, idx) => {
          const tags = idx === 0 ? ['Early Bird Deal'] : (idx === 1 ? ['Mobile Only', 'Instant Confirmation'] : ['Members Only']);

          return (
            <View key={room.room_id} className="hotel-details__room-card">
              <View className="hotel-details__room-top">
                <View className="hotel-details__room-image-wrapper">
                  <Image src={room.image_url} className="hotel-details__room-image" mode="aspectFill" />
                  {idx === 0 && <Text className="hotel-details__room-popular-tag">Popular</Text>}
                  <View className="hotel-details__room-image-count">
                    <Text className="hotel-details__room-image-count-icon">🖼</Text>
                    <Text> 5</Text>
                  </View>
                </View>

                <View className="hotel-details__room-info">
                  <View>
                    <View className="hotel-details__room-name-row">
                      <Text className="hotel-details__room-name">{room.name}</Text>
                      <Text className="hotel-details__room-expand-icon">▾</Text>
                    </View>
                    <View className="hotel-details__room-specs">
                      <Text>{room.area}m²</Text>
                      <View className="hotel-details__spec-dot"></View>
                      <Text>{room.features[1] || 'Queen Bed'}</Text>
                      <View className="hotel-details__spec-dot"></View>
                      <Text>{room.features[0] || 'City View'}</Text>
                    </View>
                    <View className="hotel-details__room-badges">
                      <Text className="hotel-details__room-badge hotel-details__room-badge--green">Free Cancellation</Text>
                      {room.has_breakfast && <Text className="hotel-details__room-badge hotel-details__room-badge--orange">Breakfast</Text>}
                    </View>
                  </View>
                </View>
              </View>

              <View className="hotel-details__room-action-area">
                <View className="hotel-details__room-price-col">
                  <View className="hotel-details__room-deal-tags">
                    {tags.map(t => (
                      <Text key={t} className="hotel-details__room-deal-tag">{t}</Text>
                    ))}
                  </View>
                  <View className="hotel-details__room-price-row">
                    <Text className="hotel-details__room-original-price">¥{room.ori_price}</Text>
                    <View className={`hotel-details__room-current-price ${idx === 1 ? 'hotel-details__room-current-price--red' : ''}`}>
                      <Text className="hotel-details__room-currency">¥</Text>
                      <Text className="hotel-details__room-price-value">{room.price}</Text>
                      <Text className="hotel-details__room-price-unit">avg/night</Text>
                    </View>
                  </View>
                  <Text className="hotel-details__room-tax-note">Includes taxes & fees</Text>
                </View>

                <View onClick={() => handleBook(room)} className="hotel-details__book-btn">
                  <Text className="hotel-details__book-btn-text">Book</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* --- Section: Hotel Honors --- */}
      <View className="hotel-details__honors">
        <Text className="hotel-details__section-title">Hotel Honors</Text>
        <View className="hotel-details__honors-card">
          <View className="hotel-details__honor-item">
            <View className="hotel-details__honor-icon-wrapper hotel-details__honor-icon-wrapper--orange">
              <Text className="hotel-details__honor-icon">🏆</Text>
            </View>
            <View className="hotel-details__honor-info">
              <Text className="hotel-details__honor-title">Top 1 Quiet Hotel</Text>
              <Text className="hotel-details__honor-desc">Awarded for exceptional soundproofing and peaceful environment.</Text>
            </View>
            <Text className="hotel-details__honor-arrow">›</Text>
          </View>
          <View className="hotel-details__honors-divider"></View>
          <View className="hotel-details__honor-item">
            <View className="hotel-details__honor-icon-wrapper hotel-details__honor-icon-wrapper--yellow">
              <Text className="hotel-details__honor-icon">👍</Text>
            </View>
            <View className="hotel-details__honor-info">
              <Text className="hotel-details__honor-title">Travelers' Choice 2024</Text>
              <Text className="hotel-details__honor-desc">Ranked among the top 10% of hotels worldwide.</Text>
            </View>
            <Text className="hotel-details__honor-arrow">›</Text>
          </View>
        </View>
      </View>

      {/* --- Section: Amenities --- */}
      <View className="hotel-details__amenities">
        <View className="hotel-details__amenities-header">
          <Text className="hotel-details__section-title" style={{ marginBottom: 0 }}>Amenities</Text>
          <Text className="hotel-details__amenities-view-all">View All ›</Text>
        </View>
        <View className="hotel-details__amenity-icons-grid">
          {[
            { icon: '🅿️', label: 'Parking' },
            { icon: '🖨', label: 'Business' },
            { icon: '🍽', label: 'Dining' },
            { icon: '📶', label: 'Free Wifi' },
            { icon: '🏋️', label: 'Gym' },
            { icon: '🏊', label: 'Pool' },
            { icon: '🧖', label: 'Spa' },
            { icon: '☕', label: 'Lounge' }
          ].map(am => (
            <View key={am.label} className="hotel-details__amenity-icon-item">
              <Text className="hotel-details__amenity-icon">{am.icon}</Text>
              <Text className="hotel-details__amenity-icon-label">{am.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* --- Section: Hotel Policy --- */}
      <View className="hotel-details__info-sections">
        <View>
          <Text className="hotel-details__section-title">Hotel Policy</Text>
          <View className="hotel-details__policy-card">
            <View className="hotel-details__policy-row">
              <Text className="hotel-details__policy-label">Check-in</Text>
              <Text className="hotel-details__policy-value">After 14:00</Text>
            </View>
            <View className="hotel-details__policy-row">
              <Text className="hotel-details__policy-label">Check-out</Text>
              <Text className="hotel-details__policy-value">Before 12:00</Text>
            </View>
            <Text className="hotel-details__policy-text">Guests are required to show a photo identification and credit card upon check-in. Please note that all Special Requests are...</Text>
            <View className="hotel-details__policy-read-more">
              <Text>Read More ▾</Text>
            </View>
          </View>
        </View>

        <View>
          <Text className="hotel-details__section-title">Location</Text>
          <View className="hotel-details__location-card">
            <View className="hotel-details__map-preview">
              <View className="hotel-details__map-marker">
                <View className="hotel-details__map-marker-label">
                  <Text>{hotel.name.split(' ')[0]} Hotel</Text>
                </View>
                <View className="hotel-details__map-marker-dot"></View>
              </View>
            </View>
            <View className="hotel-details__location-station">
              <View className="hotel-details__station-info">
                <Text className="hotel-details__station-icon">🚇</Text>
                <View>
                  <Text className="hotel-details__station-name">Nearest Station</Text>
                  <Text className="hotel-details__station-distance">2 min walk · 150m</Text>
                </View>
              </View>
              <Text className="hotel-details__station-arrow">›</Text>
            </View>
          </View>
        </View>
      </View>

      {/* --- Section: Reviews --- */}
      <View className="hotel-details__reviews">
        <Text className="hotel-details__section-title hotel-details__section-title--lg">Guest Reviews</Text>

        <View className="hotel-details__reviews-card">
          <View className="hotel-details__review-summary">
            <Text className="hotel-details__review-summary-title">"Excellent"</Text>
            <View>
              <View className="hotel-details__review-stars">
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} className="hotel-details__review-star">
                    <Text className="hotel-details__review-star-icon">♥</Text>
                  </View>
                ))}
              </View>
              <Text className="hotel-details__review-count">{hotel.reviews_count} reviews</Text>
            </View>
          </View>

          <View className="hotel-details__review-tags">
            {[
              { label: 'Good Service', count: 231 },
              { label: 'Clean & Tidy', count: 207 },
              { label: 'Convenient', count: 177 },
              { label: 'Quiet', count: 163 },
              { label: 'Nice Room', count: 155 },
              { label: 'Near Metro', count: 145 }
            ].map(tag => (
              <View key={tag.label} className="hotel-details__review-tag">
                <Text>{tag.label} {tag.count}</Text>
              </View>
            ))}
          </View>

          <View className="hotel-details__review-list">
            <View className="hotel-details__review-item">
              <View className="hotel-details__reviewer-info">
                <View className="hotel-details__reviewer-avatar">
                  <Text className="hotel-details__reviewer-avatar-icon">👤</Text>
                </View>
                <View>
                  <View className="hotel-details__reviewer-name-row">
                    <Text className="hotel-details__reviewer-name">Dong**</Text>
                    <Text className="hotel-details__reviewer-badge">Gold Member</Text>
                  </View>
                  <Text className="hotel-details__reviewer-stay">Feb 2026 Stayed in Superior King Room</Text>
                </View>
              </View>

              <View className="hotel-details__review-score-row">
                <View className="hotel-details__review-score">
                  <Text>5.0</Text>
                </View>
                <Text className="hotel-details__review-mini-tag">Nice Bathroom</Text>
                <Text className="hotel-details__review-mini-tag">Room is Good</Text>
                <Text className="hotel-details__review-mini-tag">Quiet</Text>
              </View>

              <Text className="hotel-details__review-text">The stay was very good.</Text>

              <View className="hotel-details__review-helpful">
                <View className="hotel-details__review-helpful-btn">
                  <Text>👍 Helpful</Text>
                </View>
              </View>
            </View>

            <View className="hotel-details__review-item hotel-details__review-item--bordered">
              <View className="hotel-details__reviewer-info">
                <View className="hotel-details__reviewer-avatar">
                  <Text className="hotel-details__reviewer-avatar-icon">👤</Text>
                </View>
                <View>
                  <View className="hotel-details__reviewer-name-row">
                    <Text className="hotel-details__reviewer-name">Zhou*</Text>
                    <Text className="hotel-details__reviewer-badge">Gold Member</Text>
                  </View>
                  <Text className="hotel-details__reviewer-stay">Feb 2026 Stayed in Superior King Room</Text>
                </View>
              </View>

              <View className="hotel-details__review-score-row">
                <View className="hotel-details__review-score">
                  <Text>5.0</Text>
                </View>
                <Text className="hotel-details__review-mini-tag">Clean</Text>
                <Text className="hotel-details__review-mini-tag">Good Service</Text>
              </View>

              <Text className="hotel-details__review-text">
                Two minutes walk from the high-speed rail station, very convenient. Front desk service is also very good, warm and thoughtful. The room is clean and hygienic.
              </Text>

              <View className="hotel-details__review-helpful">
                <View className="hotel-details__review-helpful-btn">
                  <Text>👍 Helpful</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="hotel-details__review-view-more">
            <View className="hotel-details__review-view-more-link">
              <Text>View More ›</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: '40px' }}></View>
    </ScrollView>
  );
};

export default HotelDetails;
