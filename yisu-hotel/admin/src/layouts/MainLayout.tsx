import React, { useState } from 'react'
import { Layout, Menu, Avatar, Breadcrumb, Dropdown, theme } from 'antd'
import type { MenuProps } from 'antd'
import { AppstoreOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons'
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

  React.useEffect(() => {
    const titleMap: Record<string, string> = {
      '/rooms': '酒店管理',
      '/inventory': '房型与库存管理',
      '/orders': '订单管理',
    }
    const pageTitle = titleMap[location.pathname] || '易宿酒店'
    document.title = `${pageTitle} - 商家端`
  }, [location.pathname])

  const [user, setUser] = useState({
    name: '未知用户',
    role: '商家管理员',
    email: '',
    avatar: '',
  })

  React.useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser({
          name: userData.username || userData.account || '未知用户',
          role: userData.role === '管理' ? '超级管理员' : '商家管理员',
          email: userData.email || '',
          avatar: userData.avatar || '',
        })
      } catch (err) {
        console.error('Failed to parse user info', err)
      }
    }
  }, [])

  const userMenu: MenuProps = {
    items: [
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
          defaultSelectedKeys={['rooms']}
          selectedKeys={[location.pathname.replace('/', '') || 'rooms']}
          items={[
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
                {
                  key: 'orders',
                  icon: <FileTextOutlined />,
                  label: '订单管理',
                  onClick: () => navigate('/orders'),
                },
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
                        : location.pathname === '/orders'
                          ? '订单管理'
                          : location.pathname.replace('/', '') || '酒店管理',
                },
              ]}
            />
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userSection}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userRole}>{user.email || user.role}</div>
              </div>
              <Dropdown menu={userMenu}>
                <Avatar
                  src={user.avatar || undefined}
                  size={36}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb',
                    backgroundColor: user.avatar ? 'transparent' : '#135bec',
                    color: 'white',
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
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
