import React from 'react'
import { Table, Tag, Tooltip, Button, Space } from 'antd'
import {
  EditOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { HotelStatus, type IHotel } from '@yisu/shared'
import styles from '../Dashboard.module.scss'

// Mock Data
const mockHotels: IHotel[] = [
  {
    id: 'H-2023-001',
    name: '易宿广场大酒店',
    submissionDate: '2023年10月24日',
    status: HotelStatus.PUBLISHED,
  },
  {
    id: 'H-2023-002',
    name: '日落湾度假村',
    submissionDate: '2023年10月23日',
    status: HotelStatus.REJECTED,
    rejectionReason: '上传的物业文件不完整。',
  },
  {
    id: 'H-2023-005',
    name: '城中城旅馆',
    submissionDate: '2023年10月22日',
    status: HotelStatus.PUBLISHED,
  },
  {
    id: 'H-2023-008',
    name: '山景山庄',
    submissionDate: '2023年10月20日',
    status: HotelStatus.REJECTED,
    rejectionReason: '违反定价政策。请查阅指南。',
  },
]

const HotelTable: React.FC = () => {
  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: IHotel) => (
        <div className={styles.hotelInfo}>
          <div className={styles.iconWrapper}>
            {record.id.endsWith('1') || record.id.endsWith('5') ? (
              <ApartmentOutlined style={{ fontSize: 20 }} />
            ) : (
              <HomeOutlined style={{ fontSize: 20 }} />
            )}
          </div>
          <div className={styles.details}>
            <p className={styles.name}>{text}</p>
            <p className={styles.id}>ID: {record.id}</p>
          </div>
        </div>
      ),
    },
    {
      title: '提交日期',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: HotelStatus, record: IHotel) => {
        let color = 'default'
        let text = '未知'

        switch (status) {
          case HotelStatus.PUBLISHED:
            color = 'success'
            text = '已发布'
            break
          case HotelStatus.REJECTED:
            color = 'error'
            text = '已驳回'
            break
          case HotelStatus.PENDING:
            color = 'processing'
            text = '审核中'
            break
        }

        return (
          <Space>
            <Tag color={color} style={{ borderRadius: 12, padding: '0 8px' }}>
              <span style={{ marginRight: 4 }}>•</span> {text}
            </Tag>
            {status === HotelStatus.REJECTED && record.rejectionReason && (
              <Tooltip title={`原因：${record.rejectionReason}`}>
                <InfoCircleOutlined style={{ color: '#9ca3af', cursor: 'help' }} />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'right' as const,
      render: () => <Button type="text" icon={<EditOutlined />} className={styles.actionButton} />,
    },
  ]

  return (
    <div className={styles.section} style={{ padding: 0, overflow: 'hidden' }}>
      <div className={styles.tableHeader} style={{ padding: '24px 24px 16px', margin: 0 }}>
        <h2 style={{ margin: 0 }}>最近酒店状态</h2>
        <a href="#">查看全部</a>
      </div>
      <Table
        columns={columns}
        dataSource={mockHotels}
        rowKey="id"
        pagination={{ position: ['bottomRight'], pageSize: 4, total: 12, current: 1 }}
        scroll={{ x: 600 }}
      />
    </div>
  )
}

export default HotelTable
