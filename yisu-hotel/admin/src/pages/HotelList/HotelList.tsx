import React, { useState } from 'react'
import { Table, Tag, Button, Tooltip, Modal, message } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  PlusOutlined,
  HomeOutlined,
  BankOutlined,
  ShopOutlined,
  CoffeeOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { HotelStatus, type IHotel } from '@yisu/shared'
import styles from './HotelList.module.scss'

// Mock Data
const mockHotels: IHotel[] = [
  {
    id: 'H-2023-001',
    name: '易宿广场大酒店',
    description: '豪华型 · 5星级',
    address: '北京市朝阳区建国路88号',
    submissionDate: '2023年10月24日',
    status: HotelStatus.PUBLISHED,
  },
  {
    id: 'H-2023-002',
    name: '日落湾度假村',
    description: '度假型 · 4星级',
    address: '海南省三亚市亚龙湾度假区1号',
    submissionDate: '2023年10月23日',
    status: HotelStatus.REJECTED,
    rejectionReason: '上传的物业文件不完整。',
  },
  {
    id: 'H-2023-005',
    name: '城中城旅馆',
    description: '经济型 · 3星级',
    address: '上海市黄浦区南京东路555号',
    submissionDate: '2023年10月22日',
    status: HotelStatus.PENDING,
  },
  {
    id: 'H-2023-008',
    name: '山景山庄',
    description: '民宿 · 精选',
    address: '浙江省杭州市西湖区满觉陇路',
    submissionDate: '2023年10月20日',
    status: HotelStatus.REJECTED,
    rejectionReason: '违反定价政策。请查阅指南。',
  },
  {
    id: 'H-2023-012',
    name: '云端商务酒店',
    description: '商务型 · 4星级',
    address: '广东省深圳市南山区科技园',
    submissionDate: '2023年10月18日',
    status: HotelStatus.PUBLISHED,
  },
]

// Map hotel ID to icon
const getHotelIcon = (id: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    'H-2023-001': <BankOutlined style={{ fontSize: 20 }} />,
    'H-2023-002': <CoffeeOutlined style={{ fontSize: 20 }} />,
    'H-2023-005': <ApartmentOutlined style={{ fontSize: 20 }} />,
    'H-2023-008': <HomeOutlined style={{ fontSize: 20 }} />,
    'H-2023-012': <ShopOutlined style={{ fontSize: 20 }} />,
  }
  return iconMap[id] || <BankOutlined style={{ fontSize: 20 }} />
}

const HotelList: React.FC = () => {
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: 12,
    showTotal: (total, range) => `显示 ${range[0]} 到 ${range[1]} 条，共 ${total} 条结果`,
  })

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination(paginationConfig)
    // TODO: Fetch data from API with new pagination params
  }

  const handleViewReason = (reason: string) => {
    Modal.error({
      title: '驳回原因',
      content: reason,
      okText: '我知道了',
    })
  }

  const handleSubmitReview = (hotel: IHotel) => {
    message.success(`已提交"${hotel.name}"的审核申请`)
    // TODO: Call API to submit review
  }

  const columns: ColumnsType<IHotel> = [
    {
      title: '酒店ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id: string) => <span className={styles.hotelId}>{id}</span>,
    },
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (_: string, record: IHotel) => (
        <div className={styles.hotelInfo}>
          <div className={styles.iconWrapper}>{getHotelIcon(record.id)}</div>
          <div className={styles.details}>
            <p className={styles.name}>{record.name}</p>
            {record.description && <p className={styles.desc}>{record.description}</p>}
          </div>
        </div>
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <Tooltip title={address}>
          <span className={styles.address}>{address}</span>
        </Tooltip>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: HotelStatus) => {
        const statusConfig: Record<HotelStatus, { color: string; text: string }> = {
          [HotelStatus.PUBLISHED]: { color: 'success', text: '已通过' },
          [HotelStatus.REJECTED]: { color: 'error', text: '已驳回' },
          [HotelStatus.PENDING]: { color: 'processing', text: '待审核' },
        }
        const config = statusConfig[status]
        return (
          <Tag color={config.color} style={{ borderRadius: 12, padding: '0 10px' }}>
            <span style={{ marginRight: 4 }}>•</span>
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      width: 220,
      render: (_: unknown, record: IHotel) => {
        const isRejected = record.status === HotelStatus.REJECTED
        const canSubmit = isRejected

        return (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => message.info('编辑详情')}
            >
              编辑详情
            </button>
            {canSubmit ? (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => handleSubmitReview(record)}
              >
                提交审核
              </button>
            ) : (
              <button type="button" className={`${styles.actionBtn} ${styles.disabled}`} disabled>
                提交审核
              </button>
            )}
            {isRejected && record.rejectionReason && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={() => handleViewReason(record.rejectionReason!)}
              >
                查看原因
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <div className={styles.pageHeader}>
          <h2>我的酒店</h2>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            添加新酒店
          </Button>
        </div>

        <div className={styles.tableCard}>
          <Table<IHotel>
            columns={columns}
            dataSource={mockHotels}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
          />
        </div>

        <div className={styles.footer}>© 2026 易宿酒店平台。保留所有权利。</div>
      </div>
    </div>
  )
}

export default HotelList
