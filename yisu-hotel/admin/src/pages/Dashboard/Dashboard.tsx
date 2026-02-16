import React from 'react'
import { Button } from 'antd'
import {
  ApartmentOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons'
import StatCard from './components/StatCard'
import HotelTable from './components/HotelTable'
import styles from './Dashboard.module.scss'
import type { IStatCardData } from '@yisu/shared'

const Dashboard: React.FC = () => {
  const statCards: IStatCardData[] = [
    {
      title: '总酒店数',
      value: 12,
      icon: <ApartmentOutlined style={{ fontSize: 24, color: '#137fec' }} />,
      description: '管理您的酒店',
      colorClass: 'primary', // In SCSS we need to handle this or use inline styles if dynamic
    },
    {
      title: '活跃房型',
      value: 48,
      icon: <EnvironmentOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      trend: {
        value: 2,
        isPositive: true,
        label: '本月新增',
      },
      description: '本月新增',
      colorClass: 'info',
    },
    {
      title: '待处理订单',
      value: 8,
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      description: '需要处理',
      colorClass: 'warning',
    },
    {
      title: '今日入住',
      value: 15,
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      trend: {
        value: 4,
        isPositive: true,
        label: '较昨日',
      },
      description: '较昨日',
      colorClass: 'success',
    },
  ]

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.statGrid}>
        {statCards.map((card, index) => (
          <StatCard key={index} data={card} />
        ))}
      </div>

      <div className={styles.section}>
        <h2>快速操作</h2>
        <div className={styles.quickActions}>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            创建新酒店
          </Button>
          <Button icon={<AppstoreAddOutlined />} size="large">
            添加房型
          </Button>
        </div>
      </div>

      <HotelTable />

      <div style={{ textAlign: 'center', marginTop: 32, color: '#9ca3af', fontSize: 12 }}>
        © 2026 易宿酒店平台。保留所有权利。
      </div>
    </div>
  )
}

export default Dashboard
