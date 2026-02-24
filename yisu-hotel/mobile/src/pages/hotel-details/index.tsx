import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { Order, OrderStatus } from '../../../types/types';
import { hotelApi, HotelDetails, RoomDetails } from '../../api/hotel';
import DatePicker from '../../components/DatePicker/DatePicker';
import RoomDetailModal from '../../components/RoomDetailModal/RoomDetailModal';
import './index.scss';

const HotelDetailsPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || 'h_1';

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetails | null>(null);

  // Try to read dates from storage (set by search page)
  const [dates, setDates] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Safari/WeChat Mini program bug: 'YYYY-MM-DD' parses as invalid date. Use 'YYYY/MM/DD'.
    const parseSafeDate = (dateStr: string) => {
      return new Date(dateStr.replace(/-/g, '/'));
    };

    // 1. Try to read from Router Params first (Passed from Search page)
    if (router.params.check_in && router.params.check_out) {
      return {
        start: parseSafeDate(router.params.check_in),
        end: parseSafeDate(router.params.check_out)
      };
    }

    // 2. Fallback to LocalStorage 'searchParams'
    try {
      const raw = Taro.getStorageSync('searchParams');
      if (raw) {
        const params = JSON.parse(raw);
        if (params.check_in && params.check_out) {
          return {
            start: parseSafeDate(params.check_in),
            end: parseSafeDate(params.check_out)
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { start: today, end: tomorrow };
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Helper to format date cleanly as YYYY-MM-DD
        const getYYYYMMDD = (d: Date) => {
          const y = d.getFullYear();
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          const day = d.getDate().toString().padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const res = await hotelApi.getHotelDetails({
          hotel_id: id,
          check_in: getYYYYMMDD(dates.start),
          check_out: getYYYYMMDD(dates.end)
        });
        if (res.data) {
          setHotelDetails(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch hotel details', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();

    // 记录浏览历史 & 检查收藏状态
    try {
      const userInfoStr = Taro.getStorageSync('userInfo');
      const userId = userInfoStr ? JSON.parse(userInfoStr).user_id : null;
      if (userId) {
        hotelApi.addViewHistory({ user_id: userId, hotel_id: id }).catch(() => { });
        hotelApi.checkFavorite({ user_id: userId, target_id: id, type: 1 }).then(res => {
          if (res?.data?.is_favorite !== undefined) {
            setIsFavorite(res.data.is_favorite);
          }
        }).catch(() => { });
      }
    } catch { }
  }, [id, dates]);

  if (loading) {
    return (
      <View className="hotel-details" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Text>玩命加载中...</Text>
      </View>
    );
  }

  if (!hotelDetails) {
    return (
      <View className="hotel-details">
        <Text>未找到酒店信息</Text>
      </View>
    );
  }

  const handleBook = (room: RoomDetails, pkgPrice: number, pkgName: string, pkgBreakfast: string, pkgCancellation: string, pkgDesc: string) => {
    // Check login status first
    const userInfoStr = Taro.getStorageSync('userInfo');
    if (!userInfoStr) {
      Taro.showModal({
        title: '需要登录',
        content: '登录后预定更多酒店',
        confirmText: '登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' });
          }
        }
      });
      return;
    }

    let userInfo;
    try {
      userInfo = typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr;
    } catch (e) {
      userInfo = userInfoStr;
    }

    // 1. Create PENDING order immediately
    const orderNights = Math.max(1, Math.round((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPrice = pkgPrice * orderNights;

    const newOrder: Order = {
      order_id: `o_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: userInfo.user_id,
      hotel_id: hotelDetails.hotel_id,
      hotel_name: hotelDetails.name,
      hotel_image: hotelDetails.media?.[0]?.url || '',
      room_id: room.room_id,
      room_name: pkgName,
      check_in: dates.start.toISOString().split('T')[0],
      check_out: dates.end.toISOString().split('T')[0],
      nights: orderNights,
      room_count: 1,
      canCancel: pkgCancellation.includes('不可取消') ? 0 : 1,
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
      hotel: hotelDetails,
      room,
      dates: { start: dates.start.getTime(), end: dates.end.getTime() },
      pkgBreakfast,
      pkgCancellation,
      pkgPrice,
      pkgDesc
    }));

    // 4. Navigate with orderId
    Taro.navigateTo({ url: `/pages/booking/index?orderId=${newOrder.order_id}` });
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setDates({ start, end });
    // TODO: Since dates changed, we ideally should re-fetch hotel details or room prices
    // but for now, just updating UI state
  };

  const formatDate = (d: Date) => {
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  };

  const getWeekday = (date: Date) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  };

  const nights = Math.max(1, Math.round((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)));
  const heroImage = hotelDetails.media?.find(m => m.media_type === 1)?.url || hotelDetails.image_url || 'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?auto=format&fit=crop&w=800&q=80';
  const mediaCount = hotelDetails.media?.length || 0;

  const toggleRoomExpand = (roomId: string) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const getPackages = (room: RoomDetails) => {
    const packages: any[] = [];
    const baseBreakfast = room.has_breakfast === 1 ? 1 : 0;

    // 使用入住日期当天的 18:00 作为免费取消的截止时间
    const cancelDate = new Date(dates.start);
    const mm = (cancelDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = cancelDate.getDate().toString().padStart(2, '0');
    const cancelTimeStr = `${mm}月${dd}日18:00`;

    const roomMinPrice = Number(room.avg_price) || 0;
    const roomOriPrice = Number(room.ori_price) || 0;

    for (let b = baseBreakfast; b <= 2; b++) {
      const bLabel = b === 0 ? '无餐食' : `${b}份早餐`;
      const increase = (b - baseBreakfast) * 20;

      const nonFreePrice = roomMinPrice + increase;
      const freePrice = nonFreePrice + 10;

      const safeOri = roomOriPrice > roomMinPrice ? roomOriPrice : (roomMinPrice);
      const oriPriceNonFree = safeOri + increase;
      const oriPriceFree = oriPriceNonFree + 10;

      packages.push({
        id: `${room.room_id}_${b}_non_free`,
        breakfast: bLabel,
        cancellation: '不可取消',
        desc: '5小时内确认',
        price: nonFreePrice,
        oriPrice: oriPriceNonFree,
        hasTags: false,
        isFree: false
      });

      packages.push({
        id: `${room.room_id}_${b}_free`,
        breakfast: bLabel,
        cancellation: `${cancelTimeStr}前免费取消`,
        desc: '延迟退房 | 立即确认',
        price: freePrice,
        oriPrice: oriPriceFree,
        hasTags: true,
        isFree: true
      });
    }
    return packages;
  };

  const userInfoStr = Taro.getStorageSync('userInfo');
  let userPoints = 0;
  try {
    if (userInfoStr) {
      const userInfoObj = typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr;
      userPoints = Number(userInfoObj.points) || 0;
    }
  } catch (e) {
    console.error('Failed to parse userInfo', e);
  }
  const pointDiscount = Math.floor(userPoints / 10000 * 20);

  const NEW_AMENITIES = [
    { label: `${hotelDetails?.open_time ? hotelDetails.open_time.substring(0, 4) : '2014'}年开业`, icon: "https://api.iconify.design/lucide:newspaper.svg?color=%23333333&strokeWidth=1.5" },
    { label: '家庭房', icon: "https://api.iconify.design/lucide:home.svg?color=%23333333&strokeWidth=1.5" },
    { label: '山景房', icon: "https://api.iconify.design/lucide:mountain.svg?color=%23333333&strokeWidth=1.5" },
    { label: '棋牌房', icon: "https://api.iconify.design/mdi:cards-playing-outline.svg?color=%23333333" },
    { label: '免费停车', icon: "https://api.iconify.design/mdi:alpha-p-circle-outline.svg?color=%23333333" },
    { label: '洗衣房', icon: "https://api.iconify.design/lucide:shirt.svg?color=%23333333&strokeWidth=1.5" },
  ];

  return (
    <ScrollView scrollY className="hotel-details">
      {/* --- Hero Image Section --- */}
      <View className="hotel-details__hero">
        {mediaCount > 0 ? (
          <Swiper
            className="hotel-details__hero-bg"
            circular
            autoplay
            interval={2000}
            onChange={(e) => setCurrentMediaIndex(e.detail.current)}
          >
            {hotelDetails.media.map((m, idx) => (
              <SwiperItem key={idx}>
                <Image src={m.url} className="hotel-details__hero-bg-img" mode="aspectFill" />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <Image src={heroImage} className="hotel-details__hero-bg" mode="aspectFill" />
        )}
        <View className="hotel-details__hero-gradient"></View>

        <View className="hotel-details__top-nav">
          <View onClick={() => Taro.navigateBack()} className="hotel-details__nav-btn">
            <Text className="hotel-details__nav-btn-icon">‹</Text>
          </View>
          <View className="hotel-details__nav-actions">
            <View className="hotel-details__nav-btn" onClick={() => {
              try {
                const userInfoStr = Taro.getStorageSync('userInfo');
                const userId = userInfoStr ? JSON.parse(userInfoStr).user_id : null;
                if (!userId) {
                  Taro.showToast({ title: '请先登录', icon: 'none' });
                  return;
                }
                hotelApi.toggleFavorite({ user_id: userId, target_id: id, type: 1 }).then(res => {
                  if (res?.data?.is_favorite !== undefined) {
                    setIsFavorite(res.data.is_favorite);
                    Taro.showToast({ title: res.data.is_favorite ? '已收藏' : '已取消收藏', icon: 'none' });
                  }
                }).catch(() => { });
              } catch { }
            }}>
              <Image src={isFavorite ? 'https://api.iconify.design/lucide:heart.svg?color=%23ff4d4f' : 'https://api.iconify.design/lucide:heart.svg?color=white'} style={{ width: 20, height: 20 }} />
            </View>
            <View className="hotel-details__nav-btn">
              <Image src="https://api.iconify.design/lucide:share.svg?color=white" style={{ width: 20, height: 20 }} />
            </View>
          </View>
        </View>

        <View className="hotel-details__image-counter">
          <Image src="https://api.iconify.design/lucide:image.svg?color=white" style={{ width: 14, height: 14 }} className="hotel-details__image-counter-icon" />
          <Text>{mediaCount > 0 ? currentMediaIndex + 1 : 1}/{mediaCount > 0 ? mediaCount : 1}</Text>
        </View>
      </View>

      {/* --- Main Content --- */}
      <View className="hotel-details__main">
        <View>
          <View className="hotel-details__title-row">
            <Text className="hotel-details__title">{hotelDetails.name}</Text>
            {(hotelDetails.tags && hotelDetails.tags.length > 0) && (
              <Text className="hotel-details__tag-badge hotel-details__tag-badge--inline">{hotelDetails.tags[0]}</Text>
            )}
          </View>
        </View>

        {/* New Line Amenities Scroller */}
        <View className="hotel-details__line-amenities-wrapper">
          <View className="hotel-details__line-amenities-scroll-area">
            <ScrollView scrollX className="hotel-details__line-amenities-scroll" scrollWithAnimation>
              <View className="hotel-details__line-amenities-container">
                {NEW_AMENITIES.map((am, index) => (
                  <View key={am.label} className={`hotel-details__line-amenity-col ${index > 0 ? 'hotel-details__line-amenity-col--border' : ''}`}>
                    <Image src={am.icon} className="hotel-details__line-amenity-icon" />
                    <Text className="hotel-details__line-amenity-label">{am.label}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          <View className="hotel-details__line-amenity-col hotel-details__line-amenity-col--border hotel-details__line-amenity-col--more">
            <Text className="hotel-details__line-amenity-more-text">设施<br />详情</Text>
            <Text className="hotel-details__line-amenity-more-icon">›</Text>
          </View>
        </View>

        {/* Ranking Banners */}
        <View className="hotel-details__rankings">
          {hotelDetails.ranking?.city_rank && (
            <View className="hotel-details__ranking-banner hotel-details__ranking-banner--orange">
              <View className="hotel-details__ranking-info">
                <Image src="https://api.iconify.design/lucide:trophy.svg?color=%23f97316" style={{ width: 16, height: 16 }} className="hotel-details__ranking-icon" />
                <Text className="hotel-details__ranking-text hotel-details__ranking-text--orange">排名 #{hotelDetails.ranking.city_rank} in {hotelDetails.city_name} 热门推荐</Text>
              </View>
              <Text className="hotel-details__ranking-arrow hotel-details__ranking-arrow--orange">›</Text>
            </View>
          )}
          {hotelDetails.ranking?.total_rank && (
            <View className="hotel-details__ranking-banner hotel-details__ranking-banner--yellow">
              <View className="hotel-details__ranking-info">
                <Image src="https://api.iconify.design/lucide:award.svg?color=%23eab308" style={{ width: 16, height: 16 }} className="hotel-details__ranking-icon" />
                <Text className="hotel-details__ranking-text hotel-details__ranking-text--yellow">全站总榜第 {hotelDetails.ranking.total_rank} 名</Text>
              </View>
              <Text className="hotel-details__ranking-arrow hotel-details__ranking-arrow--yellow">›</Text>
            </View>
          )}
        </View>

        {/* Score & Map Row */}
        <View className="hotel-details__score-map-row">
          <View className="hotel-details__score-card">
            <View className="hotel-details__score-top">
              <Text className="hotel-details__score-number">{hotelDetails.score}</Text>
              <Text className="hotel-details__score-label">{hotelDetails.score >= 4.5 ? '极好' : '很好'}</Text>
            </View>
            <View className="hotel-details__score-reviews" onClick={() => Taro.navigateTo({ url: `/pages/reviews/index?id=${hotelDetails.hotel_id}` })}>
              <Text>{hotelDetails.reviews_count} 条点评 ›</Text>
            </View>
            {/* <Text className="hotel-details__score-subtitle">卫生 4.9 · 服务 4.8</Text> */}
          </View>

          <View className="hotel-details__map-card">
            <View className="hotel-details__map-info">
              <Text className="hotel-details__map-address">{hotelDetails.address}</Text>
              <Text className="hotel-details__map-distance">市中心 0.5km</Text>
            </View>
            <View className="hotel-details__map-icon-wrapper">
              <Image src="https://api.iconify.design/lucide:map-pin.svg?color=%23ea580c" style={{ width: 18, height: 18 }} className="hotel-details__map-icon" />
            </View>
          </View>
        </View>

        {/* Coupon Row */}
        {/* <View className="hotel-details__coupon-row">
          <View className="hotel-details__coupon-pills">
            <Text className="hotel-details__coupon-label">Coupons</Text>
            <Text className="hotel-details__coupon-pill">15% Off</Text>
            <Text className="hotel-details__coupon-pill">$50 Voucher</Text>
          </View>
          <View className="hotel-details__coupon-claim">
            <Text>Claim ›</Text>
          </View>
        </View> */}
      </View>

      {/* --- Sticky Tabs & Date --- */}
      <View className="hotel-details__sticky-section">
        {/* Date Row */}
        <View className="hotel-details__date-row" onClick={() => setShowDatePicker(!showDatePicker)}>
          <View className="hotel-details__date-info">
            <Text className="hotel-details__date-text">{formatDate(dates.start)} {getWeekday(dates.start)}</Text>
            <View className="hotel-details__nights-badge">
              <Text>{nights}晚</Text>
            </View>
            <Text className="hotel-details__date-text">{formatDate(dates.end)} {getWeekday(dates.end)}</Text>
          </View>
        </View>

        {/* Filters Row */}
        <View className="hotel-details__filters-row">
          <ScrollView scrollX className="hotel-details__filters-scroll" showScrollbar={false}>
            <View className="hotel-details__filter-pills">
              {['含早餐', '不含早餐', '双床房', '大床房'].map((filter) => {
                const isActive = activeFilters.includes(filter);
                return (
                  <View
                    key={filter}
                    className={`hotel-details__filter-pill ${isActive ? 'hotel-details__filter-pill--active' : ''}`}
                    onClick={() => {
                      setActiveFilters(prev =>
                        prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
                      );
                    }}
                  >
                    <Text>{filter}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          {/* <View className="hotel-details__filter-action">
            <Text>筛选 ▾</Text>
          </View> */}
        </View>
      </View>

      {/* --- Room List --- */}
      <View className="hotel-details__room-list">
        {hotelDetails.rooms?.filter(room => {
          const bedStr = (room.room_bed || '') + (room.name || '');
          if (activeFilters.includes('大床房') && !bedStr.includes('大床')) return false;
          if (activeFilters.includes('双床房') && !bedStr.includes('双床') && !bedStr.includes('双人床')) return false;

          let pkgs = getPackages(room);
          if (activeFilters.includes('含早餐') && !activeFilters.includes('不含早餐')) {
            pkgs = pkgs.filter(p => p.breakfast !== '无餐食');
          } else if (activeFilters.includes('不含早餐') && !activeFilters.includes('含早餐')) {
            pkgs = pkgs.filter(p => p.breakfast === '无餐食');
          }

          return pkgs.length > 0;
        }).map((room, idx) => {
          const isExpanded = !!expandedRooms[room.room_id];
          let pkgs = getPackages(room);
          if (activeFilters.includes('含早餐') && !activeFilters.includes('不含早餐')) {
            pkgs = pkgs.filter(p => p.breakfast !== '无餐食');
          } else if (activeFilters.includes('不含早餐') && !activeFilters.includes('含早餐')) {
            pkgs = pkgs.filter(p => p.breakfast === '无餐食');
          }

          return (
            <View key={room.room_id} className="hotel-details__room-container">
              {/* Summary Card */}
              <View className="hotel-details__room-summary" onClick={() => toggleRoomExpand(room.room_id)}>
                <View className="hotel-details__room-summary-img-box" onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); }}>
                  <Image src={room.image_url || ''} className="hotel-details__room-summary-img" mode="aspectFill" />
                  {idx === 0 && <Text className="hotel-details__room-summary-tag">热门推荐</Text>}
                  <View className="hotel-details__room-summary-img-count">
                    <Image src="https://api.iconify.design/lucide:image.svg?color=white" style={{ width: 10, height: 10 }} />
                    <Text> {room.images && room.images.length > 0 ? room.images.length : 1}</Text>
                  </View>
                </View>

                <View className="hotel-details__room-summary-info">
                  <View className="hotel-details__room-summary-header">
                    <View className="hotel-details__room-summary-title-wrapper">
                      <Text className="hotel-details__room-summary-title">{room.name}</Text>
                    </View>
                    <View className={`hotel-details__room-summary-expand-icon ${isExpanded ? 'hotel-details__room-summary-expand-icon--expanded' : ''}`}>
                      <Text>⌄</Text>
                    </View>
                  </View>
                  <View className="hotel-details__room-summary-desc">
                    <Text>{room.area}m² {room.room_bed || '大床'}</Text>
                  </View>
                  <View className="hotel-details__room-summary-price-area">
                    <View className="hotel-details__room-summary-price">
                      {room.ori_price && room.ori_price > room.avg_price && (
                        <Text className="hotel-details__room-summary-ori-price">¥{room.ori_price}</Text>
                      )}
                      <Text className={`hotel-details__room-summary-min-price ${room.ori_price && room.ori_price > room.avg_price ? 'hotel-details__room-summary-min-price--red' : ''}`}>
                        <Text style={{ fontSize: '12px' }}>均¥</Text>{room.avg_price}
                      </Text>
                    </View>
                    {userPoints > 0 && pointDiscount > 0 && (
                      <View className="hotel-details__room-summary-discount">
                        <Text>当前会员等级可优惠{pointDiscount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Packages List */}
              {isExpanded && (
                <View className="hotel-details__room-packages">
                  {pkgs.map(pkg => (
                    <View key={pkg.id} className="hotel-details__pkg-card">
                      <View className="hotel-details__pkg-info">
                        <View className="hotel-details__pkg-title-row">
                          <Text className={`hotel-details__pkg-breakfast ${pkg.breakfast === '无餐食' ? 'hotel-details__pkg-breakfast--gray' : 'hotel-details__pkg-breakfast--green'}`}>{pkg.breakfast}</Text>
                          <Text className="hotel-details__pkg-separator"> | </Text>
                          <Text className={`hotel-details__pkg-cancel ${pkg.isFree ? 'hotel-details__pkg-cancel--green' : ''}`}>
                            {pkg.cancellation} {pkg.isFree ? '›' : ''}
                          </Text>
                        </View>

                        {pkg.hasTags && (
                          <View className="hotel-details__pkg-gift">
                            <Text className="hotel-details__pkg-gift-icon">礼</Text>
                            <Text>暖冬养颜茶自助1份/天+打车券...</Text>
                          </View>
                        )}

                        <View className="hotel-details__pkg-services">
                          {pkg.isFree ? (
                            <View className="hotel-details__pkg-services-flex">
                              <View className="hotel-details__pkg-service-tag">
                                <Text>延迟退房</Text>
                              </View>
                              <View className="hotel-details__pkg-service-tag">
                                <Text>立即确认</Text>
                              </View>
                            </View>
                          ) : (
                            <Text className="hotel-details__pkg-service-text">⏱ {pkg.desc}</Text>
                          )}
                        </View>
                      </View>

                      <View className="hotel-details__pkg-action">
                        <View className="hotel-details__pkg-price-row">
                          {pkg.oriPrice > pkg.price && (
                            <Text className="hotel-details__pkg-ori-price">¥{pkg.oriPrice}</Text>
                          )}
                          <Text className="hotel-details__pkg-cur-price">
                            <Text style={{ fontSize: '10px' }}>均¥</Text>
                            <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>{pkg.price}</Text>
                          </Text>
                        </View>
                        {pkg.oriPrice > pkg.price && (
                          <View className="hotel-details__pkg-discount">
                            <Text>优惠{(pkg.oriPrice - pkg.price)}</Text>
                          </View>
                        )}
                        <View className="hotel-details__pkg-book-btn" onClick={() => handleBook(room, pkg.price, `${room.name}(${pkg.breakfast})`, pkg.breakfast, pkg.cancellation, pkg.desc)}>
                          <Text className="hotel-details__pkg-book-btn-text">订</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* --- Section: 基础信息 --- */}
      <View className="hotel-details__info-sections">
        <View className="hotel-details__policy-card">
          <View className="hotel-details__section-title">酒店基础信息</View>
          <View className="hotel-details__policy-row">
            <Text className="hotel-details__policy-label">入住时间</Text>
            <Text className="hotel-details__policy-value">下午 14:00之后</Text>
          </View>
          <View className="hotel-details__policy-row">
            <Text className="hotel-details__policy-label">退房时间</Text>
            <Text className="hotel-details__policy-value">上午 12:00之前</Text>
          </View>
          <Text className={`hotel-details__policy-text ${!isDescExpanded ? 'hotel-details__policy-text--clamped' : ''}`}>
            {hotelDetails.description}
          </Text>
          {hotelDetails.description && hotelDetails.description.length > 60 && (
            <View className="hotel-details__policy-read-more" onClick={() => setIsDescExpanded(!isDescExpanded)}>
              <Text>{isDescExpanded ? '收起 ▴' : '更多 ▾'}</Text>
            </View>
          )}
        </View>

        <View className="hotel-details__location-card">
          <View className="hotel-details__section-title">周边位置</View>
          <View className="hotel-details__map-preview">
            <View className="hotel-details__map-marker">
              <View className="hotel-details__map-marker-label">
                <Text>{hotelDetails.name.split(' ')[0]}</Text>
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

      {/* --- Section: Reviews --- */}
      <View className="hotel-details__reviews">
        <View className="hotel-details__reviews-card">
          <View className="hotel-details__section-title hotel-details__section-title--lg">用户评价</View>
          <View className="hotel-details__review-summary">
            <Text className="hotel-details__review-summary-title">{hotelDetails.score >= 4.5 ? '“极好”' : '“很好”'}</Text>
            <View>
              <View className="hotel-details__review-stars">
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} className="hotel-details__review-star">
                    <Text className="hotel-details__review-star-icon">♥</Text>
                  </View>
                ))}
              </View>
              <Text className="hotel-details__review-count">{hotelDetails.reviews_count} 条评价</Text>
            </View>
          </View>

          <View className="hotel-details__review-tags">
            {hotelDetails.review_keywords && hotelDetails.review_keywords.length > 0 ? (
              hotelDetails.review_keywords.map(kw => (
                <View key={kw} className="hotel-details__review-tag">
                  <Text>{kw}</Text>
                </View>
              ))
            ) : (
              <View className="hotel-details__review-tag"><Text>暂无评价</Text></View>
            )}
          </View>

          <View className="hotel-details__review-list">
            {hotelDetails.reviews?.map((review, i) => (
              <View key={i} className={`hotel-details__review-item ${i > 0 ? 'hotel-details__review-item--bordered' : ''}`}>
                <View className="hotel-details__reviewer-info">
                  <View className="hotel-details__reviewer-avatar">
                    <Text className="hotel-details__reviewer-avatar-icon">👤</Text>
                  </View>
                  <View>
                    <View className="hotel-details__reviewer-name-row">
                      <Text className="hotel-details__reviewer-name">{review.username || '匿名用户'}</Text>
                    </View>
                    <Text className="hotel-details__reviewer-stay">{review.created_at?.slice(0, 10)} 发表</Text>
                  </View>
                </View>

                <View className="hotel-details__review-score-row">
                  <View className="hotel-details__review-score">
                    <Text>{review.score}</Text>
                  </View>
                  {review.tags && review.tags.length > 0 && review.tags.map((tag: string) => (
                    <Text key={tag} style={{ fontSize: '11px', color: '#ff7d00', background: '#fff7e6', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>{tag}</Text>
                  ))}
                </View>

                <Text className="hotel-details__review-text">{review.content}</Text>
              </View>
            ))}
          </View>

          <View className="hotel-details__review-view-more" onClick={() => Taro.navigateTo({ url: `/pages/reviews/index?id=${hotelDetails.hotel_id}` })}>
            <View className="hotel-details__review-view-more-link">
              <Text>更多 ›</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: '40px' }}></View>

      <RoomDetailModal
        isOpen={!!selectedRoom}
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onBook={() => {
          if (selectedRoom) {
            setExpandedRooms(prev => ({ ...prev, [selectedRoom.room_id]: true }));
          }
          setSelectedRoom(null);
        }}
      />

      <DatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
        startDate={dates.start}
        endDate={dates.end}
      />
    </ScrollView>
  );
};

export default HotelDetailsPage;
