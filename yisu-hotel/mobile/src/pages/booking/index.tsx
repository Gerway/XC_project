import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Input, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, useUnload } from '@tarojs/taro';
import { Hotel, Room, Coupon } from '../../../types/types';
import { COUPONS } from '../../constants';
import { hotelApi, DailyInventory } from '../../api/hotel';
import './index.scss';

const Booking: React.FC = () => {
  const router = useRouter();
  const { orderId } = router.params;

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
          } : undefined,
          pkgBreakfast: (data.pkgBreakfast || '无餐食') as string,
          pkgCancellation: (data.pkgCancellation || '不可取消') as string,
          pkgPrice: Number(data.pkgPrice) || 0,
          pkgDesc: (data.pkgDesc || '立即确认') as string
        };
      }
    } catch (e) { /* ignore */ }
    return null;
  }, []);

  const hotel = bookingData?.hotel;
  const room = bookingData?.room;
  const coupons = COUPONS;


  const safeDates = useMemo(() => bookingData?.dates || {
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1))
  }, [bookingData]);

  const pkgPrice = bookingData?.pkgPrice || 0;
  const pkgBreakfast = bookingData?.pkgBreakfast || '无餐食';
  const pkgCancellation = bookingData?.pkgCancellation || '不可取消';
  const pkgDesc = bookingData?.pkgDesc || '立即确认';

  const nights = Math.max(1, Math.round((safeDates.end.getTime() - safeDates.start.getTime()) / (1000 * 60 * 60 * 24)));

  const [guestName, setGuestName] = useState(() => {
    try { const u = JSON.parse(Taro.getStorageSync('userInfo') || '{}'); return u.username || '访客'; } catch { return '访客'; }
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    try { const u = JSON.parse(Taro.getStorageSync('userInfo') || '{}'); return u.phone || ''; } catch { return ''; }
  });
  const [arrivalTime, setArrivalTime] = useState('19:00前');
  const [notes, setNotes] = useState('');
  const [roomCount, setRoomCount] = useState(1);
  const [maxRoomCount, setMaxRoomCount] = useState(10); // capped by min_stock
  const [dailyPrices, setDailyPrices] = useState<DailyInventory[]>([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPriceDetailModal, setShowPriceDetailModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showBreakfast, setShowBreakfast] = useState(false);
  const [breakfastCounts, setBreakfastCounts] = useState<Record<string, number>>({});
  const [breakfastInitialized, setBreakfastInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Dynamic ID Cards
  const [idcards, setIdcards] = useState<string[]>(['']);

  const handleAddIdcard = () => {
    setIdcards(prev => [...prev, '']);
  };

  const handleRemoveIdcard = (index: number) => {
    setIdcards(prev => prev.filter((_, i) => i !== index));
  };

  const handleIdcardChange = (index: number, value: string) => {
    setIdcards(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Parse initial breakfast count from package
  const pkgBreakfastCount = useMemo(() => {
    const bf = bookingData?.pkgBreakfast || '无餐食';
    const match = bf.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }, [bookingData]);

  // Read user points for membership value
  const userPoints = useMemo(() => {
    try {
      const u = JSON.parse(Taro.getStorageSync('userInfo') || '{}');
      return Number(u.points) || 0;
    } catch { return 0; }
  }, []);
  const membershipValue = Math.floor(userPoints / 10000) * 20;

  // Fetch per-day inventory AND create a pending order on mount
  useEffect(() => {
    const initOrder = async () => {
      const roomId = (room as any)?.room_id;
      if (!roomId) return;
      const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const checkIn = fmt(safeDates.start);
      const checkOut = fmt(safeDates.end);

      try {
        // 1. Fetch inventory
        const invRes = await hotelApi.getRoomInventory({ room_id: roomId, check_in: checkIn, check_out: checkOut });
        let dailyArray: any[] = [];
        if (invRes?.data) {
          dailyArray = invRes.data.daily || [];
          setDailyPrices(dailyArray);
          const ms = invRes.data.min_stock ?? 10;
          setMaxRoomCount(Math.max(1, ms));
          setRoomCount(prev => Math.min(prev, Math.max(1, ms)));
        }

        // 2. Create pending order (status=0) in DB
        const userInfoStr = Taro.getStorageSync('userInfo');
        const userId = userInfoStr ? JSON.parse(userInfoStr).user_id : null;
        const hotelId = (hotel as any)?.hotel_id;
        const canCancel = pkgCancellation.includes('免费') ? 1 : 0;

        const roomPriceTotal = dailyArray.length > 0
          ? dailyArray.reduce((sum, d) => sum + d.price, 0) // initial roomCount is 1 here, but just in case, we'll use state
          : pkgPrice * nights;

        const initialTotalPrice = roomPriceTotal;
        const initialRealPay = Math.max(0, initialTotalPrice - membershipValue);

        const dailyDetails = dailyArray.map(d => ({
          date: d.date,
          price: d.price,
          breakfast_count: 0
        }));

        if (userId && hotelId) {
          const ordRes = await hotelApi.createOrder({
            user_id: userId,
            hotel_id: hotelId,
            room_id: roomId,
            check_in: checkIn,
            check_out: checkOut,
            nights,
            room_count: 1, // typically 1 on mount
            total_price: initialTotalPrice,
            real_pay: initialRealPay,
            can_cancel: canCancel,
            daily: dailyDetails
          });
          if (ordRes?.data?.order_id) {
            setPendingOrderId(ordRes.data.order_id);
          }
        }
      } catch (err) {
        console.error('initOrder error', err);
      }
    };
    initOrder();
  }, []);

  if (!hotel || !room) {
    return (
      <View className="booking-page">
        <Text>加载中...</Text>
      </View>
    );
  }

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

  // Per-day actual total room cost (use dailyPrices if available, else fallback)
  const roomPriceTotal = dailyPrices.length > 0
    ? dailyPrices.reduce((sum, d) => sum + d.price, 0) * roomCount
    : pkgPrice * nights * roomCount;
  const breakfastPricePerUnit = 40;
  const totalBreakfastCount = (Object.values(breakfastCounts) as number[]).reduce((a, b) => a + b, 0);
  const breakfastTotal = totalBreakfastCount * breakfastPricePerUnit;
  const rawTotal = roomPriceTotal + breakfastTotal;
  const discountAmount = selectedCoupon ? selectedCoupon.discount_amount : 0;
  const total = Math.max(0, rawTotal - discountAmount - membershipValue);
  // Points = pre-discount room cost only (no breakfast, no coupon, no membership deduction)
  const pointsEarned = Math.floor(roomPriceTotal);

  const availableCoupons = coupons.filter(c => !c.is_used && c.min_spend <= rawTotal);

  // Auto-update ref so useUnload gets latest data
  const isPaidRef = useRef(false);
  const latestDataRef = useRef<{
    pendingOrderId: string | null;
    rawTotal: number;
    total: number;
    notes: string;
    idcards: string[];
    dailyPrices: DailyInventory[];
    roomCount: number;
    breakfastCounts: Record<string, number>;
    breakfastDates: string[];
    stayDates: string[];
    pkgPrice: number;
  }>({
    pendingOrderId: null,
    rawTotal: 0,
    total: 0,
    notes: '',
    idcards: [''],
    dailyPrices: [],
    roomCount: 1,
    breakfastCounts: {},
    breakfastDates: [],
    stayDates: [],
    pkgPrice: 0
  });

  useEffect(() => {
    latestDataRef.current = {
      pendingOrderId,
      rawTotal,
      total,
      notes,
      idcards,
      dailyPrices,
      roomCount,
      breakfastCounts,
      breakfastDates,
      stayDates,
      pkgPrice
    };
  }, [pendingOrderId, rawTotal, total, notes, idcards, dailyPrices, roomCount, breakfastCounts, breakfastDates, stayDates, pkgPrice]);

  useUnload(() => {
    // If not paid and we have an order id, update the order details with user selection
    if (!isPaidRef.current && latestDataRef.current.pendingOrderId) {
      const v = latestDataRef.current;
      const validIdcards = v.idcards.filter(id => id.trim() !== '');

      const dailyDetail = v.dailyPrices.length > 0
        ? v.dailyPrices.map((d, i) => {
          const morningDate = v.breakfastDates[i];
          return {
            date: d.date,
            price: d.price * v.roomCount,
            breakfast_count: v.breakfastCounts[morningDate] || 0
          };
        })
        : v.stayDates.map((date, i) => {
          const morningDate = v.breakfastDates[i];
          return {
            date,
            price: v.pkgPrice * v.roomCount,
            breakfast_count: v.breakfastCounts[morningDate] || 0
          };
        });

      hotelApi.updatePendingOrder({
        order_id: v.pendingOrderId as string,
        real_pay: v.total,
        total_price: v.rawTotal,
        room_count: v.roomCount,
        special_request: v.notes,
        idcards: JSON.stringify(validIdcards),
        daily: dailyDetail
      }).catch(e => console.error('Failed to sync order on unload:', e));
    }
  });

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

  // Initialize breakfast counts with package default (only once after breakfastDates are ready)
  if (!breakfastInitialized && pkgBreakfastCount > 0 && breakfastDates.length > 0) {
    const initial: Record<string, number> = {};
    breakfastDates.forEach(d => { initial[d] = pkgBreakfastCount; });
    setBreakfastCounts(initial);
    setBreakfastInitialized(true);
  }

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

  const handlePay = async () => {
    if (!guestName || !phoneNumber) {
      Taro.showToast({ title: '请填写入住人信息', icon: 'none' });
      return;
    }
    setIsProcessing(true);

    try {
      // Build daily detail array for order_details
      // Note: `dailyPrices[i].date` is the stay night (e.g. 24th). `breakfastDates[i]` is the morning (e.g. 25th).
      const dailyDetail = dailyPrices.length > 0
        ? dailyPrices.map((d, i) => {
          const morningDate = breakfastDates[i];
          return {
            date: d.date,
            price: d.price * roomCount,
            breakfast_count: breakfastCounts[morningDate] || 0
          };
        })
        : stayDates.map((date, i) => {
          const morningDate = breakfastDates[i];
          return {
            date,
            price: pkgPrice * roomCount,
            breakfast_count: breakfastCounts[morningDate] || 0
          };
        });

      if (pendingOrderId) {
        const validIdcards = idcards.filter(id => id.trim() !== '');

        // Use the real API
        await hotelApi.payOrder({
          order_id: pendingOrderId,
          real_pay: total,
          total_price: rawTotal,
          room_count: roomCount,
          special_request: notes,
          idcards: JSON.stringify(validIdcards),
          daily: dailyDetail
        });
        isPaidRef.current = true; // Mark as paid so useUnload doesn't sync again
      } else {
        throw new Error('No pending order ID');
      }

      setIsProcessing(false);
      Taro.showToast({ title: '支付成功！', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/orders/index' });
      }, 1500);
    } catch (e) {
      console.error('Pay error', e);
      setIsProcessing(false);
      Taro.showToast({ title: '支付失败，请重试', icon: 'none' });
    }
  };

  const dateRangeText = `${formatDateShort(safeDates.start.toISOString())}-${formatDateShort(safeDates.end.toISOString())} 共${nights}晚`;

  return (
    <View className="booking-page">
      {/* Header */}
      <View className="booking-page__header">
        <View className="booking-page__header-inner">
          <View onClick={() => Taro.navigateBack()} className="booking-page__back-btn">
            <Text className="booking-page__back-icon">‹</Text>
          </View>
          <Text className="booking-page__title">{hotel.name}</Text>
          {/* <View className="booking-page__header-actions">
            <Text className="booking-page__more-icon">⋯</Text>
          </View> */}
        </View>
      </View>

      <ScrollView scrollY className="booking-page__main">
        {/* Room Info Section */}
        <View className="booking-page__section booking-page__section--padded">
          <View className="booking-page__date-row">
            <Text className="booking-page__date-main">{formatDate(safeDates.start)}</Text>
            <Text className="booking-page__date-label">{isToday(safeDates.start) ? '今天' : ''}</Text>
            <Text className="booking-page__nights-tag">共{nights}晚</Text>
            <Text className="booking-page__date-main">{formatDate(safeDates.end)}</Text>
            <Text className="booking-page__date-label">{isTomorrow(safeDates.end) ? '明天' : ''}</Text>
          </View>

          <Text className="booking-page__room-name">{room.name}</Text>

          <View className="booking-page__policy">
            <Image src="https://api.iconify.design/lucide:info.svg?color=%23f97316" style={{ width: 16, height: 16 }} />
            <View className="booking-page__policy-content">
              <Text className="booking-page__policy-title">入住与取消政策：</Text>
              <Text>入住时间为下午 14:00 之后。{pkgCancellation}</Text>
            </View>
          </View>
        </View>

        {/* Confirmation Banner */}
        <View className="booking-page__confirm-banner">
          <View className="booking-page__confirm-info">
            <Image src="https://api.iconify.design/lucide:circle-check.svg?color=%23f97316" style={{ width: 16, height: 16 }} />
            <Text className="booking-page__confirm-text">{pkgDesc.includes('5小时') ? '预订后5小时内确认' : '预订后立即确认！'}</Text>
          </View>
          <Text className="booking-page__confirm-arrow">›</Text>
        </View>

        {/* Booking Form */}
        <View className="booking-page__section">
          {/* Room Count */}
          <View className="booking-page__form-row" onClick={() => setShowRoomModal(true)}>
            <Text className="booking-page__form-label">房间数</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-text">{roomCount}间</Text>
              <Text className="booking-page__form-arrow">›</Text>
            </View>
          </View>

          {/* Guest Name */}
          <View className="booking-page__form-row">
            <View className="booking-page__form-label-with-help">
              <Text className="booking-page__form-label">入住人</Text>
              <Text className="booking-page__form-label-help">?</Text>
            </View>
            <View className="booking-page__form-input-right">
              <Input
                type="text"
                value={guestName}
                onInput={e => setGuestName(e.detail.value)}
                className="booking-page__form-input"
                placeholder="请输入入住人姓名"
              />
            </View>
          </View>

          {/* Phone */}
          <View className="booking-page__form-row">
            <Text className="booking-page__form-label">联系电话</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__phone-prefix">+86</Text>
              <Text className="booking-page__phone-expand">▾</Text>
              <Input
                type="number"
                value={phoneNumber}
                onInput={e => setPhoneNumber(e.detail.value)}
                className="booking-page__phone-input"
                placeholder="请输入手机号"
              />
            </View>
          </View>

          {/* ID Cards */}
          {idcards.map((id, index) => (
            <View className="booking-page__form-row" key={'idcard_' + index}>
              <View className="booking-page__form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <View
                  onClick={index === 0 ? handleAddIdcard : () => handleRemoveIdcard(index)}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: index === 0 ? '#10b981' : '#ef4444',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', lineHeight: '18px'
                  }}
                >
                  {index === 0 ? '+' : '-'}
                </View>
                <Text>身份证</Text>
              </View>
              <View className="booking-page__form-input-right">
                <Input
                  type="idcard"
                  value={id}
                  onInput={e => handleIdcardChange(index, e.detail.value)}
                  className="booking-page__form-input"
                  placeholder="请输入入住人身份证号"
                />
              </View>
            </View>
          ))}

          {/* Arrival Time */}
          <View className="booking-page__form-row" onClick={() => setShowArrivalModal(true)}>
            <Text className="booking-page__form-label">到店时间</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-text">{arrivalTime}</Text>
              <Text className="booking-page__form-arrow">›</Text>
            </View>
          </View>

          {/* Notes */}
          <View className="booking-page__form-row booking-page__form-row--no-border">
            <Text className="booking-page__form-label">备注</Text>
            <Input
              type="text"
              value={notes}
              onInput={e => setNotes(e.detail.value)}
              className="booking-page__notes-input"
              placeholder="特殊要求（可选）"
            />
          </View>
        </View>

        {/* Membership Banner */}
        <View className="booking-page__membership">
          <View className="booking-page__membership-info">
            <Image src="https://api.iconify.design/lucide:gem.svg?color=%23f97316" style={{ width: 16, height: 16 }} />
            <Text className="booking-page__membership-text">星级会员权益（价值 <Text className="booking-page__membership-value">¥{membershipValue}</Text>）</Text>
          </View>
          <Text className="booking-page__membership-arrow">›</Text>
        </View>

        {/* Add-ons & Points */}
        <View className="booking-page__addons">
          {/* Breakfast Trigger */}
          <View className="booking-page__form-row" onClick={() => setShowBreakfast(!showBreakfast)}>
            <Text className="booking-page__form-label">早餐</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">
                {totalBreakfastCount > 0 ? `已添加 ${totalBreakfastCount}份` : '添加早餐'}
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
                    <Image src="https://api.iconify.design/lucide:utensils.svg?color=%23f97316" style={{ width: 14, height: 14 }} />
                    <Text className="booking-page__breakfast-title-text">自助早餐</Text>
                  </View>
                  <Text className="booking-page__breakfast-note">仅限所选日期使用</Text>
                </View>

                {breakfastDates.map(dateStr => {
                  const count = breakfastCounts[dateStr] || 0;
                  return (
                    <View key={dateStr} className="booking-page__breakfast-row">
                      <Text className="booking-page__breakfast-date">{dateStr}</Text>
                      <View className="booking-page__breakfast-controls">
                        <Text className="booking-page__breakfast-price">¥40<Text className="booking-page__breakfast-price-unit">/人</Text></Text>
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
            <Text className="booking-page__form-label">延迟退房</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">会员 12:00 退房</Text>
              <Text className="booking-page__form-arrow">▾</Text>
            </View>
          </View>

          {/* Points */}
          <View className="booking-page__form-row">
            <Text className="booking-page__form-label">积分</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">可累積 <Text className="booking-page__points-highlight">{pointsEarned}</Text> 积分</Text>
              <Text className="booking-page__form-arrow">▾</Text>
            </View>
          </View>

          {/* Room Nights */}
          <View className="booking-page__form-row booking-page__form-row--no-border">
            <Text className="booking-page__form-label">房晚</Text>
            <View className="booking-page__form-value">
              <Text className="booking-page__form-value-plain">累计 1 晚</Text>
              <Text className="booking-page__form-arrow">▾</Text>
            </View>
          </View>
        </View>

        {/* Coupons Trigger */}
        <View className="booking-page__coupons-trigger" onClick={() => setShowCouponModal(true)}>
          <Text className="booking-page__form-label">优惠券</Text>
          <View className="booking-page__form-value">
            {selectedCoupon ? (
              <Text className="booking-page__coupon-discount">- ¥{selectedCoupon.discount_amount}</Text>
            ) : (
              <Text className="booking-page__form-value-plain">
                {availableCoupons.length > 0 ? `${availableCoupons.length} 张可用` : '无可用优惠券'}
              </Text>
            )}
            <Text className="booking-page__form-arrow">›</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View className="booking-page__disclaimer">
          <Text>提示：我们将收集您的姓名、联系方式、酒店名称、入住/退房时间，以提供酒店预订及入住服务。</Text>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: '120px' }}></View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View className="booking-page__bottom-bar">
        <View className="booking-page__bottom-inner">
          <View className="booking-page__total-section">
            <Text className="booking-page__total-label">合计</Text>
            <Text className="booking-page__total-amount">¥{total.toFixed(2)}</Text>
            <View className="booking-page__detail-toggle" onClick={() => setShowPriceDetailModal(!showPriceDetailModal)}>
              <Text>明细 </Text>
              <Text className="booking-page__detail-icon">{showPriceDetailModal ? '▾' : '▴'}</Text>
            </View>
          </View>

          <View onClick={isProcessing ? undefined : handlePay} className={`booking-page__pay-btn ${isProcessing ? 'booking-page__pay-btn--disabled' : ''}`}>
            <Text className="booking-page__pay-btn-text">{isProcessing ? '处理中...' : '提交订单'}</Text>
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
              <Text className="booking-page__modal-title">选择房间数</Text>
              <View onClick={() => setShowRoomModal(false)} className="booking-page__modal-close">
                <Text className="booking-page__modal-close-icon">✕</Text>
              </View>
            </View>
            <View className="booking-page__modal-list">
              {Array.from({ length: maxRoomCount }, (_, i) => i + 1).map(num => (
                <View
                  key={num}
                  onClick={() => { setRoomCount(num); setShowRoomModal(false); }}
                  className={`booking-page__modal-option ${roomCount === num ? 'booking-page__modal-option--active' : ''}`}
                >
                  <Text>{num}间</Text>
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
              <Text className="booking-page__modal-title">到店时间</Text>
              <View onClick={() => setShowArrivalModal(false)} className="booking-page__modal-close">
                <Text className="booking-page__modal-close-icon">✕</Text>
              </View>
            </View>
            <ScrollView scrollY className="booking-page__modal-scrollable">
              <View className="booking-page__modal-list">
                {['14:00前', '15:00前', '17:00前', '19:00前', '21:00前', '23:59前', '次日到店'].map(time => (
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
              <Text className="booking-page__modal-title">选择优惠券</Text>
              <View onClick={() => setShowCouponModal(false)} className="booking-page__modal-close">
                <Text className="booking-page__modal-close-icon">✕</Text>
              </View>
            </View>
            <ScrollView scrollY className="booking-page__modal-scroll-content">
              {availableCoupons.length === 0 ? (
                <View className="booking-page__modal-empty">
                  <Text>无可用优惠券</Text>
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
                          <Text className="booking-page__coupon-label-text">优惠券</Text>
                        </View>
                        <View className="booking-page__coupon-info">
                          <Text className="booking-page__coupon-title">{coupon.title}</Text>
                          <Text className="booking-page__coupon-min-spend">满¥{coupon.min_spend}可用</Text>
                          <Text className="booking-page__coupon-expiry">有效期至: {coupon.end_time}</Text>
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
              <View className="booking-page__price-detail-title-row">
                <Text className="booking-page__price-detail-title">费用明细</Text>
                <View onClick={() => setShowPriceDetailModal(false)} className="booking-page__price-detail-close">
                  <Text className="booking-page__price-detail-close-icon">✕</Text>
                </View>
              </View>
              <Text className="booking-page__price-detail-subtitle">{dateRangeText} · {room.name}</Text>
            </View>

            <ScrollView scrollY className="booking-page__price-detail-body">
              {/* Online Payment Total Row */}
              <View className="booking-page__price-total-row">
                <Text className="booking-page__price-total-label">在线支付</Text>
                <Text className="booking-page__price-total-value">¥{total.toFixed(2)}</Text>
              </View>

              {/* Room Rate Section */}
              <View className="booking-page__price-section">
                <View className="booking-page__price-section-header">
                  <Text className="booking-page__price-section-title">房费</Text>
                  {dailyPrices.length > 0 ? (
                    <Text className="booking-page__price-avg-label">{nights}晚 合计 ¥{roomPriceTotal.toFixed(2)}</Text>
                  ) : (
                    <View className="booking-page__price-section-avg">
                      <Text className="booking-page__price-avg-label">均价 </Text>
                      <Text className="booking-page__price-avg-value">¥{pkgPrice}</Text>
                      <Text className="booking-page__price-avg-unit">/晚</Text>
                    </View>
                  )}
                </View>
                {dailyPrices.length === 0 && (
                  <Text className="booking-page__price-subtotal">{nights}晚 合计 ¥{(pkgPrice * roomCount * nights).toFixed(2)}</Text>
                )}

                <View className="booking-page__price-breakdown">
                  {dailyPrices.length > 0 ? (
                    dailyPrices.map(d => (
                      <View key={d.date} className="booking-page__price-breakdown-row">
                        <Text>{formatDateShort(d.date)} ({roomCount}间)</Text>
                        <Text>¥{(d.price * roomCount).toFixed(2)}</Text>
                      </View>
                    ))
                  ) : (
                    stayDates.map(date => (
                      <View key={date} className="booking-page__price-breakdown-row">
                        <Text>{formatDateShort(date)} ({roomCount}间)</Text>
                        <Text>¥{(pkgPrice * roomCount).toFixed(2)}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>

              {/* Breakfast Section */}
              {totalBreakfastCount > 0 && (
                <View className="booking-page__price-section-border">
                  <View className="booking-page__price-section-header">
                    <Text className="booking-page__price-section-title">早餐</Text>
                    <View className="booking-page__price-section-avg">
                      <Text className="booking-page__price-avg-value">¥40</Text>
                      <Text className="booking-page__price-avg-unit">/人</Text>
                    </View>
                  </View>
                  <Text className="booking-page__price-subtotal">{totalBreakfastCount}份 合计 ¥{breakfastTotal}</Text>
                  <View className="booking-page__price-breakdown booking-page__price-breakdown--gray">
                    {(Object.entries(breakfastCounts) as [string, number][]).map(([date, count]) => (
                      count > 0 ? (
                        <View key={date} className="booking-page__price-breakdown-row">
                          <Text>{formatDateShort(date)} ({count}份)</Text>
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
                    <Text className="booking-page__price-section-title">优惠券</Text>
                    <Text className="booking-page__price-coupon-value">- ¥{selectedCoupon.discount_amount}</Text>
                  </View>
                </View>
              )}

              {/* Membership Discount Section */}
              {membershipValue > 0 && (
                <View className="booking-page__price-section-border">
                  <View className="booking-page__price-total-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <Text className="booking-page__price-section-title">星级会员折扣</Text>
                    <Text className="booking-page__price-coupon-value">- ¥{membershipValue}</Text>
                  </View>
                </View>
              )}

              {/* Points Section */}
              <View className="booking-page__points-section">
                <View className="booking-page__points-row">
                  <View>
                    <Text className="booking-page__points-label">积分</Text>
                    <View className="booking-page__points-detail">
                      <Text>房费积分 </Text>
                      <Text className="booking-page__points-speed-badge">1倍速</Text>
                    </View>
                  </View>
                  <Text className="booking-page__points-value">{pointsEarned} 积分</Text>
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
