import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { Hotel, Room, OrderStatus, Order, Coupon } from '../../../types/types';
import { MOCK_USER, COUPONS } from '../../constants';
import './index.scss';

const Booking: React.FC = () => {
  const router = useRouter();
  const { orderId } = router.params;
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  // Read booking info from storage (set by HotelDetails page)
  const bookingData = useMemo(() => {
    try {
      const raw = Taro.getStorageSync('bookingInfo');
      if (raw) {
        const data = JSON.parse(raw);
        return {
          hotel: data.hotel as Hotel,
          room: data.room as Room,
          dates: data.dates ? {
            start: new Date(data.dates.start),
            end: new Date(data.dates.end)
          } : undefined
        };
      }
    } catch (e) { /* ignore */ }
    return null;
  }, []);

  // Load existing order if orderId is present
  useDidShow(() => {
    if (orderId) {
      try {
        const raw = Taro.getStorageSync('orders');
        if (raw) {
          const orders: Order[] = JSON.parse(raw);
          const found = orders.find(o => o.order_id === orderId);
          if (found) {
            setCurrentOrder(found);
            // Pre-fill fields if they exist in order (e.g. if editing)
            if (found.guest_name) setGuestName(found.guest_name);
            if (found.guest_phone) setPhoneNumber(found.guest_phone);
          }
        }
      } catch (e) { }
    }
  });

  const hotel = bookingData?.hotel;
  const room = bookingData?.room;
  const user = MOCK_USER;
  const coupons = COUPONS;

  const safeDates = useMemo(() => bookingData?.dates || {
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  }, [bookingData]);

  const [guestName, setGuestName] = useState(user?.username || 'Liu Che');
  const [phoneNumber, setPhoneNumber] = useState('182 **** 7789');
  const [arrivalTime, setArrivalTime] = useState('Before 19:00');
  const [notes, setNotes] = useState('');
  const [roomCount, setRoomCount] = useState(1);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPriceDetailModal, setShowPriceDetailModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showBreakfast, setShowBreakfast] = useState(false);
  const [breakfastCounts, setBreakfastCounts] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  if (!hotel || !room) {
    return (
      <View className="booking-page">
        <Text>Loading...</Text>
      </View>
    );
  }

  const nights = Math.max(1, Math.round((safeDates.end.getTime() - safeDates.start.getTime()) / (1000 * 60 * 60 * 24)));

  const formatDateToLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const stayDates = (() => {
    const datesArr: string[] = [];
    for (let i = 0; i < nights; i++) {
      const d = new Date(safeDates.start);
      d.setDate(d.getDate() + i);
      datesArr.push(formatDateToLocalISO(d));
    }
    return datesArr;
  })();

  const breakfastDates = (() => {
    const datesArr: string[] = [];
    for (let i = 1; i <= nights; i++) {
      const d = new Date(safeDates.start);
      d.setDate(d.getDate() + i);
      datesArr.push(formatDateToLocalISO(d));
    }
    return datesArr;
  })();

  const roomPriceTotal = room.price * nights * roomCount;
  const breakfastPricePerUnit = 40;
  const totalBreakfastCount = (Object.values(breakfastCounts) as number[]).reduce((a, b) => a + b, 0);
  const breakfastTotal = totalBreakfastCount * breakfastPricePerUnit;
  const rawTotal = roomPriceTotal + breakfastTotal;
  const discountAmount = selectedCoupon ? selectedCoupon.discount_amount : 0;
  const total = Math.max(0, rawTotal - discountAmount);
  const pointsEarned = Math.floor(total);

  const availableCoupons = coupons.filter(c => !c.is_used && c.min_spend <= rawTotal);

  const formatDate = (date: Date) => {
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${m}月${d}日`;
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  };

  const isTomorrow = (d: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth();
  };

  const updateBreakfast = (dateStr: string, delta: number) => {
    setBreakfastCounts(prev => {
      const current = prev[dateStr] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [dateStr]: next };
    });
  };

  const handleCouponSelect = (coupon: Coupon) => {
    if (selectedCoupon?.coupon_id === coupon.coupon_id) {
      setSelectedCoupon(null);
    } else {
      setSelectedCoupon(coupon);
    }
    setShowCouponModal(false);
  };

  const handlePay = () => {
    if (!guestName || !phoneNumber) {
      Taro.showToast({ title: 'Please fill in all guest information.', icon: 'none' });
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      // Update existing order or create new one (fallback)
      try {
        const existingOrders = Taro.getStorageSync('orders');
        let orders: Order[] = existingOrders ? JSON.parse(existingOrders) : [];

        let targetOrder = currentOrder;

        if (targetOrder) {
          // Update existing
          const idx = orders.findIndex(o => o.order_id === targetOrder!.order_id);
          if (idx > -1) {
            orders[idx] = {
              ...orders[idx],
              user_id: user?.user_id || 'guest',
              total_price: total,
              real_pay: total,
              status: OrderStatus.PAID,
              guest_name: guestName,
              guest_phone: phoneNumber,
              note: notes,
              arrival_time: arrivalTime
            };
          }
        } else {
          // Fallback: create new (shouldn't happen with new flow)
          const newOrder: Order = {
            order_id: `o_${Date.now()}`,
            user_id: user?.user_id || 'guest',
            hotel_id: hotel.hotel_id,
            hotel_name: hotel.name,
            hotel_image: hotel.image_url,
            room_id: room.room_id,
            room_name: room.name,
            check_in: safeDates.start.toISOString().split('T')[0],
            check_out: safeDates.end.toISOString().split('T')[0],
            nights: nights,
            total_price: total,
            real_pay: total,
            status: OrderStatus.PAID,
            created_at: new Date().toISOString(),
            guest_name: guestName,
            guest_phone: phoneNumber,
            note: notes,
            arrival_time: arrivalTime
          };
          orders.unshift(newOrder);
        }

        Taro.setStorageSync('orders', JSON.stringify(orders));
      } catch (e) {
        console.log('Failed to save order', e);
      }

      setIsProcessing(false);
      Taro.showToast({ title: 'Payment Successful!', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/orders/index' });
      }, 1500);
    }, 2000);
  };

  const dateRangeText = `${formatDateShort(safeDates.start.toISOString())}-${formatDateShort(safeDates.end.toISOString())} Total ${nights} night${nights > 1 ? 's' : ''}`;

  return (
    <View className="booking-page">
      {/* Header */}
      <View className="booking-page__header">
        <View className="booking-page__header-inner">
          <View onClick={() => Taro.navigateBack()} className="booking-page__back-btn">
            <Text className="booking-page__back-icon">‹</Text>
          </View>
          <Text className="booking-page__title">{hotel.name}</Text>
          <View className="booking-page__header-actions">
            <Text className="booking-page__more-icon">⋯</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="booking-page__main">
        {/* Room Info Section */}
        <View className="booking-page__section booking-page__section--padded">
          <View className="booking-page__date-row">
            <Text className="booking-page__date-main">{formatDate(safeDates.start)}</Text>
            <Text className="booking-page__date-label">{isToday(safeDates.start) ? 'Today' : ''}</Text>
            <Text className="booking-page__nights-tag">{nights} Night{nights > 1 ? 's' : ''}</Text>
            <Text className="booking-page__date-main">{formatDate(safeDates.end)}</Text>
            <Text className="booking-page__date-label">{isTomorrow(safeDates.end) ? 'Tomorrow' : ''}</Text>
          </View>

          <Text className="booking-page__room-name">{room.name}</Text>

          <View className="booking-page__policy">
            <Text className="booking-page__policy-icon">ℹ️</Text>
            <View className="booking-page__policy-content">
              <Text className="booking-page__policy-title">Check-in & Cancellation Policy:</Text>
              <Text>Free cancellation within 1 hour after payment, non-refundable after 1 hour.</Text>
            </View>
          </View>
        </View>

        {/* Confirmation Banner */}
        <View className="booking-page__confirm-banner">
          <View className="booking-page__confirm-info">
            <Text className="booking-page__confirm-icon">✅</Text>
            <Text className="booking-page__confirm-text">Instant confirmation after booking!</Text>
          </View>
          <Text className="booking-page__confirm-arrow">›</Text>
        </View>

        {/* Booking Form */}
        <View className="booking-page__section">
          {/* Room Count */}
          <View className="booking-page__form-row" onClick={() => setShowRoomModal(true)}>
            <Text className="booking-page__form-label">Rooms</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-text">{roomCount} Room{roomCount > 1 ? 's' : ''}</Text>
              <Text className="booking-page__form-arrow">›</Text>
            </View>
          </View>

          {/* Guest Name */}
          <View className="booking-page__form-row">
            <View className="booking-page__form-label-with-help">
              <Text className="booking-page__form-label">Guest Name</Text>
              <Text className="booking-page__form-label-help">?</Text>
            </View>
            <View className="booking-page__form-input-right">
              <Input
                type="text"
                value={guestName}
                onInput={e => setGuestName(e.detail.value)}
                className="booking-page__form-input"
                placeholder="Name of guest"
              />
            </View>
          </View>

          {/* Phone */}
          <View className="booking-page__form-row">
            <Text className="booking-page__form-label">Phone</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__phone-prefix">+86</Text>
              <Text className="booking-page__phone-expand">▾</Text>
              <Input
                type="number"
                value={phoneNumber}
                onInput={e => setPhoneNumber(e.detail.value)}
                className="booking-page__phone-input"
                placeholder="Mobile Number"
              />
            </View>
          </View>

          {/* Arrival Time */}
          <View className="booking-page__form-row" onClick={() => setShowArrivalModal(true)}>
            <Text className="booking-page__form-label">Arrival Time</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-text">{arrivalTime}</Text>
              <Text className="booking-page__form-arrow">›</Text>
            </View>
          </View>

          {/* Notes */}
          <View className="booking-page__form-row booking-page__form-row--no-border">
            <Text className="booking-page__form-label">Notes</Text>
            <Input
              type="text"
              value={notes}
              onInput={e => setNotes(e.detail.value)}
              className="booking-page__notes-input"
              placeholder="Special requests (Optional)"
            />
          </View>
        </View>

        {/* Membership Banner */}
        <View className="booking-page__membership">
          <View className="booking-page__membership-info">
            <Text className="booking-page__membership-icon">💎</Text>
            <Text className="booking-page__membership-text">Star Member Benefits (Value ¥60)</Text>
          </View>
          <Text className="booking-page__membership-arrow">›</Text>
        </View>

        {/* Add-ons & Points */}
        <View className="booking-page__addons">
          {/* Breakfast Trigger */}
          <View className="booking-page__form-row" onClick={() => setShowBreakfast(!showBreakfast)}>
            <Text className="booking-page__form-label">Breakfast</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">
                {totalBreakfastCount > 0 ? `Added ${totalBreakfastCount}` : 'Add Breakfast'}
              </Text>
              <Text className={`booking-page__expand-icon ${showBreakfast ? 'booking-page__expand-icon--open' : ''}`}>▾</Text>
            </View>
          </View>

          {/* Breakfast Accordion Content */}
          {showBreakfast && (
            <View className="booking-page__breakfast-content">
              <View className="booking-page__breakfast-inner">
                <View className="booking-page__breakfast-header">
                  <View className="booking-page__breakfast-title-row">
                    <Text className="booking-page__breakfast-title-icon">🍽</Text>
                    <Text className="booking-page__breakfast-title-text">Buffet Breakfast</Text>
                  </View>
                  <Text className="booking-page__breakfast-note">Only valid on selected date</Text>
                </View>

                {breakfastDates.map(dateStr => {
                  const count = breakfastCounts[dateStr] || 0;
                  return (
                    <View key={dateStr} className="booking-page__breakfast-row">
                      <Text className="booking-page__breakfast-date">{dateStr}</Text>
                      <View className="booking-page__breakfast-controls">
                        <Text className="booking-page__breakfast-price">¥40<Text className="booking-page__breakfast-price-unit">/person</Text></Text>
                        <View className="booking-page__breakfast-counter">
                          <View
                            onClick={() => count > 0 && updateBreakfast(dateStr, -1)}
                            className={`booking-page__breakfast-btn booking-page__breakfast-btn--minus ${count === 0 ? 'booking-page__breakfast-btn--disabled' : ''}`}
                          >
                            <Text className="booking-page__breakfast-btn-icon">−</Text>
                          </View>
                          <Text className="booking-page__breakfast-count">{count}</Text>
                          <View
                            onClick={() => updateBreakfast(dateStr, 1)}
                            className="booking-page__breakfast-btn booking-page__breakfast-btn--plus"
                          >
                            <Text className="booking-page__breakfast-btn-icon">+</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Late Checkout */}
          <View className="booking-page__form-row">
            <Text className="booking-page__form-label">Late Checkout</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">Member checkout 12:00</Text>
              <Text className="booking-page__form-arrow">▾</Text>
            </View>
          </View>

          {/* Points */}
          <View className="booking-page__form-row">
            <Text className="booking-page__form-label">Points</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">Earn <Text className="booking-page__points-highlight">{pointsEarned}</Text> points</Text>
              <Text className="booking-page__form-arrow">▾</Text>
            </View>
          </View>

          {/* Room Nights */}
          <View className="booking-page__form-row booking-page__form-row--no-border">
            <Text className="booking-page__form-label">Nights</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">Accumulate 1 night</Text>
              <Text className="booking-page__form-arrow">▾</Text>
            </View>
          </View>
        </View>

        {/* Coupons Trigger */}
        <View className="booking-page__coupons-trigger" onClick={() => setShowCouponModal(true)}>
          <Text className="booking-page__form-label">Coupons</Text>
          <View className="booking-page__form-value">
            {selectedCoupon ? (
              <Text className="booking-page__coupon-discount">- ¥{selectedCoupon.discount_amount}</Text>
            ) : (
              <Text className="booking-page__form-value-plain">
                {availableCoupons.length > 0 ? `${availableCoupons.length} Available` : 'No available coupons'}
              </Text>
            )}
            <Text className="booking-page__form-arrow">›</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View className="booking-page__disclaimer">
          <Text>Reminder: We will collect your name, contact information, hotel name, and check-in/out times to provide hotel booking and stay services.</Text>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: '120px' }}></View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View className="booking-page__bottom-bar">
        <View className="booking-page__bottom-inner">
          <View className="booking-page__total-section">
            <Text className="booking-page__total-label">Total</Text>
            <Text className="booking-page__total-amount">¥{total.toFixed(2)}</Text>
            <View className="booking-page__detail-toggle" onClick={() => setShowPriceDetailModal(!showPriceDetailModal)}>
              <Text>Detail </Text>
              <Text className="booking-page__detail-icon">{showPriceDetailModal ? '▾' : '▴'}</Text>
            </View>
          </View>

          <View onClick={isProcessing ? undefined : handlePay} className={`booking-page__pay-btn ${isProcessing ? 'booking-page__pay-btn--disabled' : ''}`}>
            <Text className="booking-page__pay-btn-text">{isProcessing ? 'Processing...' : 'Submit Order'}</Text>
          </View>
        </View>
      </View>

      {/* --- Modals --- */}

      {/* Room Selection Modal */}
      {showRoomModal && (
        <View className="booking-page__modal">
          <View className="booking-page__modal-backdrop" onClick={() => setShowRoomModal(false)}></View>
          <View className="booking-page__modal-content">
            <View className="booking-page__modal-header">
              <Text className="booking-page__modal-title">Select Rooms</Text>
              <View onClick={() => setShowRoomModal(false)} className="booking-page__modal-close">
                <Text className="booking-page__modal-close-icon">✕</Text>
              </View>
            </View>
            <View className="booking-page__modal-list">
              {[1, 2, 3, 4, 5].map(num => (
                <View
                  key={num}
                  onClick={() => { setRoomCount(num); setShowRoomModal(false); }}
                  className={`booking-page__modal-option ${roomCount === num ? 'booking-page__modal-option--active' : ''}`}
                >
                  <Text>{num} Room{num > 1 ? 's' : ''}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Arrival Time Modal */}
      {showArrivalModal && (
        <View className="booking-page__modal">
          <View className="booking-page__modal-backdrop" onClick={() => setShowArrivalModal(false)}></View>
          <View className="booking-page__modal-content">
            <View className="booking-page__modal-header">
              <Text className="booking-page__modal-title">Arrival Time</Text>
              <View onClick={() => setShowArrivalModal(false)} className="booking-page__modal-close">
                <Text className="booking-page__modal-close-icon">✕</Text>
              </View>
            </View>
            <ScrollView scrollY className="booking-page__modal-scrollable">
              <View className="booking-page__modal-list">
                {['Before 14:00', 'Before 15:00', 'Before 17:00', 'Before 19:00', 'Before 21:00', 'Before 23:59', 'Late Arrival (Next Day)'].map(time => (
                  <View
                    key={time}
                    onClick={() => { setArrivalTime(time); setShowArrivalModal(false); }}
                    className={`booking-page__modal-option ${arrivalTime === time ? 'booking-page__modal-option--active' : ''}`}
                  >
                    <Text>{time}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Coupon Selection Modal */}
      {showCouponModal && (
        <View className="booking-page__modal">
          <View className="booking-page__modal-backdrop" onClick={() => setShowCouponModal(false)}></View>
          <View className="booking-page__modal-content booking-page__modal-content--tall">
            <View className="booking-page__modal-header">
              <Text className="booking-page__modal-title">Select Coupon</Text>
              <View onClick={() => setShowCouponModal(false)} className="booking-page__modal-close">
                <Text className="booking-page__modal-close-icon">✕</Text>
              </View>
            </View>
            <ScrollView scrollY className="booking-page__modal-scroll-content">
              {availableCoupons.length === 0 ? (
                <View className="booking-page__modal-empty">
                  <Text>No usable coupons for this order.</Text>
                </View>
              ) : (
                <View>
                  {availableCoupons.map(coupon => {
                    const isSelected = selectedCoupon?.coupon_id === coupon.coupon_id;
                    return (
                      <View
                        key={coupon.coupon_id}
                        onClick={() => handleCouponSelect(coupon)}
                        className={`booking-page__coupon-card ${isSelected ? 'booking-page__coupon-card--selected' : ''}`}
                      >
                        <View className="booking-page__coupon-value">
                          <Text className="booking-page__coupon-amount">¥{coupon.discount_amount}</Text>
                          <Text className="booking-page__coupon-label-text">Coupon</Text>
                        </View>
                        <View className="booking-page__coupon-info">
                          <Text className="booking-page__coupon-title">{coupon.title}</Text>
                          <Text className="booking-page__coupon-min-spend">Min spend ¥{coupon.min_spend}</Text>
                          <Text className="booking-page__coupon-expiry">Exp: {coupon.end_time}</Text>
                        </View>
                        <View className={`booking-page__coupon-check ${isSelected ? 'booking-page__coupon-check--selected' : ''}`}>
                          {isSelected && <Text className="booking-page__coupon-check-icon">✓</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Price Detail Modal */}
      {showPriceDetailModal && (
        <View className="booking-page__modal">
          <View className="booking-page__modal-backdrop" onClick={() => setShowPriceDetailModal(false)}></View>
          <View className="booking-page__modal-content booking-page__modal-content--tall">
            <View className="booking-page__price-detail-header">
              <Text className="booking-page__price-detail-title">Cost Details</Text>
              <Text className="booking-page__price-detail-subtitle">{dateRangeText}</Text>
              <Text className="booking-page__price-detail-subtitle">{room.name}</Text>
              <View onClick={() => setShowPriceDetailModal(false)} className="booking-page__price-detail-close">
                <Text className="booking-page__price-detail-close-icon">✕</Text>
              </View>
            </View>

            <ScrollView scrollY className="booking-page__price-detail-body">
              {/* Online Payment Total Row */}
              <View className="booking-page__price-total-row">
                <Text className="booking-page__price-total-label">Online Payment</Text>
                <Text className="booking-page__price-total-value">¥{total.toFixed(2)}</Text>
              </View>

              {/* Room Rate Section */}
              <View className="booking-page__price-section">
                <View className="booking-page__price-section-header">
                  <Text className="booking-page__price-section-title">Room Rate</Text>
                  <View className="booking-page__price-section-avg">
                    <Text className="booking-page__price-avg-label">Avg </Text>
                    <Text className="booking-page__price-avg-value">¥{room.price}</Text>
                    <Text className="booking-page__price-avg-unit">/night</Text>
                  </View>
                </View>
                <Text className="booking-page__price-subtotal">{nights} nights Total ¥{(room.price * roomCount * nights).toFixed(2)}</Text>

                <View className="booking-page__price-breakdown">
                  {stayDates.map(date => (
                    <View key={date} className="booking-page__price-breakdown-row">
                      <Text>{formatDateShort(date)} ({roomCount} room{roomCount > 1 ? 's' : ''})</Text>
                      <Text>¥{(room.price * roomCount).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Breakfast Section */}
              {totalBreakfastCount > 0 && (
                <View className="booking-page__price-section-border">
                  <View className="booking-page__price-section-header">
                    <Text className="booking-page__price-section-title">Breakfast</Text>
                    <View className="booking-page__price-section-avg">
                      <Text className="booking-page__price-avg-value">¥40</Text>
                      <Text className="booking-page__price-avg-unit">/person</Text>
                    </View>
                  </View>
                  <Text className="booking-page__price-subtotal">{totalBreakfastCount} person Total ¥{breakfastTotal}</Text>
                  <View className="booking-page__price-breakdown booking-page__price-breakdown--gray">
                    {(Object.entries(breakfastCounts) as [string, number][]).map(([date, count]) => (
                      count > 0 ? (
                        <View key={date} className="booking-page__price-breakdown-row">
                          <Text>{formatDateShort(date)} ({count} person)</Text>
                          <Text>¥{count * 40}</Text>
                        </View>
                      ) : null
                    ))}
                  </View>
                </View>
              )}

              {/* Coupon Section */}
              {selectedCoupon && (
                <View className="booking-page__price-section-border">
                  <View className="booking-page__price-total-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <Text className="booking-page__price-section-title">Coupon</Text>
                    <Text className="booking-page__price-coupon-value">- ¥{selectedCoupon.discount_amount}</Text>
                  </View>
                </View>
              )}

              {/* Points Section */}
              <View className="booking-page__points-section">
                <View className="booking-page__points-row">
                  <View>
                    <Text className="booking-page__points-label">Points</Text>
                    <View className="booking-page__points-detail">
                      <Text>Room rate points </Text>
                      <Text className="booking-page__points-speed-badge">1x Speed</Text>
                    </View>
                  </View>
                  <Text className="booking-page__points-value">{pointsEarned} Points</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default Booking;
