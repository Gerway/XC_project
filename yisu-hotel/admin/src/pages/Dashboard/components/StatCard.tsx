import React from 'react'
import { Card } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import styles from '../Dashboard.module.scss'
import type { IStatCardData } from '@yisu/shared'

interface StatCardProps {
  data: IStatCardData
}

const StatCard: React.FC<StatCardProps> = ({ data }) => {
  return (
    <Card bordered={false} className={styles.section} hoverable>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#8c8c8c', marginBottom: 4, fontSize: 14 }}>{data.title}</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1f1f1f' }}>{data.value}</div>
        </div>
        <div
          style={{
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className={classNames(styles[`bg-${data.colorClass}`])} // We might need to handle dynamic classes
        >
          {data.icon}
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        {data.trend && (
          <span
            style={{
              color: data.trend.isPositive ? '#52c41a' : '#f5222d',
              background: data.trend.isPositive ? '#f6ffed' : '#fff1f0',
              padding: '2px 6px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 500,
            }}
          >
            {data.trend.isPositive ? (
              <ArrowUpOutlined style={{ fontSize: 12, marginRight: 2 }} />
            ) : (
              <ArrowDownOutlined style={{ fontSize: 12, marginRight: 2 }} />
            )}
            {data.trend.value}
          </span>
        )}
        <span style={{ color: '#8c8c8c' }}>{data.description}</span>
      </div>
    </Card>
  )
}

export default StatCard
