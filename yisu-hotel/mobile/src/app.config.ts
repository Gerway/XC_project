export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/search/index',
    'pages/hotel-details/index',
    // 'pages/reviews/index',
    // 'pages/login/index',
    // 'pages/booking/index',
    'pages/profile/index',
    'pages/orders/index',
    // 'pages/order-details/index',
    // 'pages/favorites/index',
    // 'pages/coupons/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'YiSu Hotel',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    custom: false,  // 启用自定义 TabBar
    color: '#999999',
    selectedColor: '#FF6B35',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/home/index', text: '首页',
        selectedIconPath: "images/none.png",
        iconPath: "images/none.png",
      },
      {
        pagePath: 'pages/search/index', text: '搜索',
        selectedIconPath: "images/none.png",
        iconPath: "images/none.png",
      },
      {
        pagePath: 'pages/orders/index', text: '订单',
        selectedIconPath: "images/none.png",
        iconPath: "images/none.png",
      },
      {
        pagePath: 'pages/profile/index', text: '我的',
        selectedIconPath: "images/none.png",
        iconPath: "images/none.png",
      },
    ]
  }
})
