import React, { useState } from 'react'
import { Layout, Menu, Avatar, Badge, Input, Breadcrumb, Dropdown, theme } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  NotificationOutlined,
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import styles from './MainLayout.module.scss'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed] = useState(false)
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()

  // Mock User
  const user = {
    name: '张莎拉',
    role: '商家管理员',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDDLWDXONs999Kd3hGrnTvx5b3MT0qIAFtFX-EmUlXOcHFWvy3oOhAh5vnzn6ksLEmJKwb-m34ENzBGWWbG-d5zQ9coUKHP6gLouNl_vtxkPNdnXtLQCF9m7m44p_WcmOO5FEFYG7fjPTl6cljv1sT5DtmfzacEQI7Se8XJMt6AHmDAhChu_67v44jfHtYyoBOgMruVwgV-m1cHpsmO4iJG7PtDmKTn8a_CuPkfC8ovz5E00YPlJI6VCUYrv-U5M3E3PAFILjHNWlL',
  }

  const userMenu: MenuProps = {
    items: [
      {
        key: 'profile',
        label: '个人中心',
        icon: <UserOutlined />,
      },
      {
        key: 'settings',
        label: '设置',
        icon: <SettingOutlined />,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: () => navigate('/login'),
      },
    ],
  }

  return (
    <Layout className={styles.layout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        className={styles.sider}
        theme="dark"
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <AppstoreOutlined style={{ fontSize: '20px', color: 'white' }} />
          </div>
          {!collapsed && <h1>易宿酒店</h1>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          selectedKeys={[location.pathname.replace('/', '') || 'dashboard']}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: '仪表盘',
              onClick: () => navigate('/dashboard'),
            },
            {
              key: 'management',
              label: '管理',
              type: 'group',
              children: [
                {
                  key: 'rooms',
                  icon: <AppstoreOutlined />,
                  label: '酒店管理',
                  onClick: () => navigate('/rooms'),
                },
                {
                  key: 'inventory',
                  icon: <AppstoreOutlined />,
                  label: '房型与库存管理',
                  onClick: () => navigate('/inventory'),
                },
                { key: 'orders', icon: <FileTextOutlined />, label: '订单管理' },
                { key: 'customers', icon: <TeamOutlined />, label: '客户列表' },
              ],
            },
            {
              key: 'insights',
              label: '洞察',
              type: 'group',
              children: [
                { key: 'analytics', icon: <BarChartOutlined />, label: '数据分析' },
                { key: 'marketing', icon: <NotificationOutlined />, label: '营销管理' },
              ],
            },
          ]}
        />
      </Sider>
      <Layout style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
        <Header
          style={{ padding: '0 24px', background: colorBgContainer }}
          className={styles.header}
        >
          <div className={styles.headerLeft}>
            <Breadcrumb
              items={[
                { title: '首页' },
                {
                  title:
                    location.pathname === '/rooms'
                      ? '酒店管理'
                      : location.pathname === '/inventory'
                        ? '房型与库存管理'
                        : location.pathname === '/dashboard'
                          ? '仪表盘概览'
                          : location.pathname.replace('/', '') || '仪表盘概览',
                },
              ]}
            />
          </div>
          <div className={styles.headerRight}>
            <Input
              placeholder="搜索订单、客户..."
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              className={styles.searchInput}
              bordered={false}
            />
            <Badge count={1} dot>
              <div className={styles.iconButton}>
                <NotificationOutlined style={{ fontSize: '18px' }} />
              </div>
            </Badge>
            <div className={styles.userSection}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userRole}>{user.role}</div>
              </div>
              <Dropdown menu={userMenu}>
                <Avatar
                  src={user.avatar}
                  size={36}
                  style={{ cursor: 'pointer', border: '1px solid #e5e7eb' }}
                />
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
