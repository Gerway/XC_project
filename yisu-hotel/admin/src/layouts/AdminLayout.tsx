import React from 'react'
import { Layout, Menu, Avatar, Badge, Breadcrumb, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  SafetyCertificateOutlined,
  TagsOutlined,
  TeamOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import styles from './AdminLayout.module.scss'

const { Header, Sider, Content } = Layout

/** 面包屑名称映射 */
const breadcrumbMap: Record<string, string> = {
  '/admin/audit': '酒店审核',
  '/admin/coupons': '优惠券管理',
  '/admin/users': '用户管理',
}

const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    const pageTitle = breadcrumbMap[location.pathname] || '酒店审核'
    document.title = `${pageTitle} - 管理员端`
  }, [location.pathname])

  // 当前选中菜单 key
  const selectedKey = location.pathname.replace('/admin/', '') || 'audit'

  // 管理员信息 (Mock)
  const admin = {
    name: 'Admin User',
    email: 'admin@yisu.com',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCR2ipYwb56F00LcUNttR1JhpiSuxZ6qFsiX8a9D3KnfPTC1VXurTmQ3gm4g54ih8Zo9EfzrhObdJgT5Ge1rhdONdnNjRlym-io_VujQUfSV15858TqT1cm26qsCBs6ivfAmjviOHLHbP8TdUa-9Mt7PRqq-HfVZEVbvklleVgWprpW6JJyDjCrZKCHadZfXQw-wDS8z5DvSk3NiaulaE49wLmuI5Y4DPo00VznZtkFYPidtPNHu9axto_gTy-M_0_uAc101R7HuIar',
  }

  // 用户下拉菜单
  const userMenu: MenuProps = {
    items: [
      { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
      { key: 'settings', label: '设置', icon: <SettingOutlined /> },
      { type: 'divider' },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: () => navigate('/login'),
      },
    ],
  }

  // 侧边栏菜单
  const siderMenuItems: MenuProps['items'] = [
    {
      key: 'audit',
      icon: <SafetyCertificateOutlined />,
      label: '酒店审核',
      onClick: () => navigate('/admin/audit'),
    },
    {
      key: 'coupons',
      icon: <TagsOutlined />,
      label: '优惠券管理',
      onClick: () => navigate('/admin/coupons'),
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: '用户管理',
      onClick: () => navigate('/admin/users'),
    },
  ]

  return (
    <Layout className={styles.layout}>
      {/* ===== 侧边栏 ===== */}
      <Sider width={256} className={styles.sider} theme="dark" trigger={null}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>Y</div>
          <div className={styles.logoText}>
            <h1>易宿酒店管理</h1>
            <span className={styles.logoSub}>管理员端</span>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={siderMenuItems}
          style={{ marginTop: 16 }}
        />
      </Sider>

      {/* ===== 主区域 ===== */}
      <Layout style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Breadcrumb
              items={[{ title: '首页' }, { title: breadcrumbMap[location.pathname] || '酒店审核' }]}
            />
          </div>
          <div className={styles.headerRight}>
            {/* 通知 */}
            <Badge count={1} dot>
              <button className={styles.notificationBtn}>
                <BellOutlined />
              </button>
            </Badge>
            <div className={styles.divider} />
            {/* 用户信息 */}
            <Dropdown menu={userMenu}>
              <div className={styles.userSection}>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{admin.name}</div>
                  <div className={styles.userEmail}>{admin.email}</div>
                </div>
                <Avatar src={admin.avatar} size={36} style={{ border: '1px solid #e5e7eb' }} />
                <DownOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
