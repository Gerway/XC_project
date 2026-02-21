import React, { useState, useEffect } from 'react'
import { Table, Button, Form, Select, DatePicker, Input, App } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'
import { OrderStatus, type IOrder } from '@yisu/shared'
import styles from './OrderList.module.scss'

const { RangePicker } = DatePicker

// Mock Data
const mockOrders: IOrder[] = [
  {
    id: 'ORD-20231024-001',
    customerName: '李明华',
    hotelName: '易宿旗舰店',
    roomType: '豪华大床房',
    checkInDate: '2023-10-25',
    checkOutDate: '2023-10-27',
    nights: 2,
    amount: 1160.0,
    status: OrderStatus.PENDING,
  },
  {
    id: 'ORD-20231023-082',
    customerName: '张小凡',
    hotelName: '易宿旗舰店',
    roomType: '行政套房',
    checkInDate: '2023-10-23',
    checkOutDate: '2023-10-25',
    nights: 2,
    amount: 2560.0,
    status: OrderStatus.CHECKED_IN,
  },
  {
    id: 'ORD-20231021-045',
    customerName: '王美丽',
    hotelName: '易宿精品店',
    roomType: '标准双床房',
    checkInDate: '2023-10-21',
    checkOutDate: '2023-10-22',
    nights: 1,
    amount: 380.0,
    status: OrderStatus.COMPLETED,
  },
  {
    id: 'ORD-20231020-112',
    customerName: '赵子龙',
    hotelName: '易宿旗舰店',
    roomType: '海景家庭房',
    checkInDate: '2023-10-20',
    checkOutDate: '2023-10-23',
    nights: 3,
    amount: 2640.0,
    status: OrderStatus.COMPLETED,
  },
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待入住', value: OrderStatus.PENDING },
  { label: '已入住', value: OrderStatus.CHECKED_IN },
  { label: '已完成', value: OrderStatus.COMPLETED },
]

const statusConfig: Record<OrderStatus, { text: string; className: string }> = {
  [OrderStatus.PENDING]: { text: '待入住', className: styles.pending },
  [OrderStatus.CHECKED_IN]: { text: '已入住', className: styles.checkedIn },
  [OrderStatus.COMPLETED]: { text: '已完成', className: styles.completed },
}

const OrderList: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<IOrder[]>([])
  const { message } = App.useApp()
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 128,
    showTotal: (total) => `共 ${total} 条记录，每页 10 条`,
  })

  // Simulate async data loading
  const fetchOrders = () => {
    setLoading(true)
    setTimeout(() => {
      setOrders(mockOrders)
      setLoading(false)
    }, 600)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(mockOrders)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const handleSearch = () => {
    const values = form.getFieldsValue()
    console.log('Filter values:', values)
    message.info('查询功能（演示）')
    fetchOrders()
  }

  const handleReset = () => {
    form.resetFields()
    fetchOrders()
  }

  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination(pag)
    // TODO: Fetch data with new pagination
  }

  const handleCheckIn = (order: IOrder) => {
    message.success(`已办理"${order.customerName}"的入住`)
  }

  const handleComplete = (order: IOrder) => {
    message.success(`订单"${order.id}"已标记完成`)
  }

  const handleViewDetail = (order: IOrder) => {
    message.info(`查看订单 ${order.id} 详情`)
  }

  const columns: ColumnsType<IOrder> = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id: string) => <span className={styles.orderId}>{id}</span>,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 100,
      render: (name: string) => <span className={styles.customerName}>{name}</span>,
    },
    {
      title: '酒店/房型',
      key: 'hotel',
      width: 150,
      render: (_: unknown, record: IOrder) => (
        <div className={styles.hotelInfo}>
          <p className={styles.hotelName}>{record.hotelName}</p>
          <p className={styles.roomType}>{record.roomType}</p>
        </div>
      ),
    },
    {
      title: '入住/退房日期',
      key: 'dates',
      width: 220,
      render: (_: unknown, record: IOrder) => (
        <div className={styles.dateInfo}>
          <p className={styles.dateRange}>
            {record.checkInDate} / {record.checkOutDate}
          </p>
          <p className={styles.nights}>{record.nights} 晚</p>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span className={styles.amount}>
          ¥{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => {
        const config = statusConfig[status]
        return <span className={`${styles.statusBadge} ${config.className}`}>{config.text}</span>
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      width: 120,
      render: (_: unknown, record: IOrder) => {
        if (record.status === OrderStatus.PENDING) {
          return (
            <Button
              type="primary"
              size="small"
              className={styles.actionCheckIn}
              onClick={() => handleCheckIn(record)}
            >
              办理入住
            </Button>
          )
        }
        if (record.status === OrderStatus.CHECKED_IN) {
          return (
            <Button
              size="small"
              className={styles.actionComplete}
              onClick={() => handleComplete(record)}
            >
              标记完成
            </Button>
          )
        }
        return (
          <Button
            type="link"
            size="small"
            className={styles.actionDetail}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
        )
      },
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* Filter Bar */}
        <div className={styles.filterCard}>
          <Form form={form} layout="vertical">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                alignItems: 'end',
              }}
            >
              <Form.Item label="订单状态" name="status">
                <Select placeholder="全部状态" options={statusOptions} allowClear />
              </Form.Item>
              <Form.Item label="入住日期范围" name="dateRange">
                <RangePicker />
              </Form.Item>
              <Form.Item label="关键词搜索" name="keyword">
                <Input
                  prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="搜索订单号 / 客户名"
                />
              </Form.Item>
              <Form.Item>
                <div className={styles.filterActions}>
                  <Button type="primary" onClick={handleSearch} style={{ flex: 1 }}>
                    查询
                  </Button>
                  <Button onClick={handleReset}>重置</Button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* Order Table */}
        <div className={styles.tableCard}>
          <Table<IOrder>
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </div>

        <div className={styles.footer}>© 2026 易宿酒店管理平台。保留所有权利。</div>
      </div>
    </div>
  )
}

export default OrderList
