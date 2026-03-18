export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/search/index',
    'pages/welfare/index',
    'pages/login/index',
    'pages/profile/index',
    'pages/orders/index',
  ],
  subPackages: [
    {
      root: 'packageHotel',
      pages: [
        'hotel-details/index',
        'reviews/index',
        'write-review/index',
        'booking/index',
      ],
    },
    {
      root: 'packageUser',
      pages: [
        'order-details/index',
        'favorites/index',
        'coupons/index',
      ],
    },
  ],
  preloadRule: {
    'pages/search/index': {
      network: 'all', // 在什么样的网络环境下触发预下载
      packages: ['packageHotel'], // 下载哪一个（或哪些）分包
    },
    'pages/profile/index': {
      network: 'all',
      packages: ['packageUser'],
    },
    'pages/orders/index': {
      network: 'all',
      packages: ['packageUser'],
    },
    'packageUser/order-details/index': {
      network: 'all',
      packages: ['packageHotel'],
    },
  },
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
    selectedColor: '#f48b23',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/home/index', text: '首页',
        selectedIconPath: "images/tab_home_selected.png",
        iconPath: "images/tab_home_normal.png",
      },
      {
        pagePath: 'pages/welfare/index', text: '福利中心',
        selectedIconPath: "images/tab_welfare_selected.png",
        iconPath: "images/tab_welfare_normal.png",
      },
      {
        pagePath: 'pages/orders/index', text: '订单',
        selectedIconPath: "images/tab_orders_selected.png",
        iconPath: "images/tab_orders_normal.png",
      },
      {
        pagePath: 'pages/profile/index', text: '我的',
        selectedIconPath: "images/tab_profile_selected.png",
        iconPath: "images/tab_profile_normal.png",
      },
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '您的位置将用于显示附近酒店'
    }
  },
  requiredPrivateInfos: ["getLocation"]
})
