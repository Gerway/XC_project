import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Button, Form, Select, DatePicker, Input, App, Space, Tag, Tooltip } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { SearchOutlined, EditOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { orderApi, ORDER_STATUS, type IOrderRecord, type OrderStatusValue } from '../../api/order'
import styles from './OrderList.module.scss'
import { StatusTag } from '../../components/StatusTag'
import { FormModal } from '../../components/FormModal'

const { RangePicker } = DatePicker

// ─── 状态映射 ────────────────────────────────────────────────────────────────

/** 后端 status 数字 → 前端显示配置 */
const STATUS_CONFIG: Record<
  OrderStatusValue,
  { text: string; className: string; tagColor: string }
> = {
  [ORDER_STATUS.UNPAID]: {
    text: '未支付',
    className: styles.unpaid,
    tagColor: 'default',
  },
  [ORDER_STATUS.PAID]: {
    text: '待入住',
    className: styles.pending,
    tagColor: 'orange',
  },
  [ORDER_STATUS.CHECKED_IN]: {
    text: '已入住',
    className: styles.checkedIn,
    tagColor: 'blue',
  },
  [ORDER_STATUS.COMPLETED]: {
    text: '已完成',
    className: styles.completed,
    tagColor: 'default',
  },
  [ORDER_STATUS.CANCELLED]: {
    text: '已取消',
    className: styles.cancelled,
    tagColor: 'red',
  },
}

/** 查询过滤用的状态选项列表 */
const STATUS_FILTER_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '未支付', value: ORDER_STATUS.UNPAID },
  { label: '待入住', value: ORDER_STATUS.PAID },
  { label: '已入住', value: ORDER_STATUS.CHECKED_IN },
  { label: '已完成', value: ORDER_STATUS.COMPLETED },
  { label: '已取消', value: ORDER_STATUS.CANCELLED },
]

/** 编辑弹窗中的状态选项 */
const STATUS_EDIT_OPTIONS = STATUS_FILTER_OPTIONS.slice(1) // 去掉"全部状态"

// ─── 编辑弹窗表单类型 ──────────────────────────────────────────────────────────

interface EditFormValues {
  status: OrderStatusValue
  check_in: Dayjs | null
  check_out: Dayjs | null
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const OrderList: React.FC = () => {
  const [filterForm] = Form.useForm()
  const [editForm] = Form.useForm<EditFormValues>()
  const { message } = App.useApp()

  // 列表数据状态
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<IOrderRecord[]>([])
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total) => `共 ${total} 条记录，每页 10 条`,
    showSizeChanger: false,
  })

  // 编辑弹窗状态
  const [editVisible, setEditVisible] = useState(false)
  const [editTarget, setEditTarget] = useState<IOrderRecord | null>(null)

  // ── 获取当前登录商户的 user_id ────────────────────────────────────────────
  const getCurrentUserId = (): string => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        return String(userData.user_id || userData.id || '')
      }
    } catch {
      /* ignore */
    }
    return ''
  }

  // ── 获取订单列表 ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (page = 1, pageSize = 10) => {
      const userId = getCurrentUserId()
      if (!userId) {
        message.warning('无法获取当前用户信息，请重新登录')
        return
      }

      const filterValues = filterForm.getFieldsValue()
      const { status, dateRange, keyword } = filterValues

      setLoading(true)
      try {
        const params: Parameters<typeof orderApi.getMerchantOrderList>[0] = {
          page,
          pageSize,
          user_id: userId,
        }

        if (status !== '' && status !== undefined) {
          params.status = status as OrderStatusValue
        }
        if (dateRange && dateRange[0]) {
          // dateRange 是 [Dayjs, Dayjs]，接口只用于过滤，无该需求时保留 keyword
        }
        if (keyword) {
          params.order_id = keyword
        }

        const res = await orderApi.getMerchantOrderList(params)

        if (res && res.code === 200) {
          setOrders(res.data.list)
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize,
            total: res.data.total,
          }))
        } else {
          message.error(res?.message || '获取订单列表失败')
        }
      } catch (err: unknown) {
        const errObj = err as { message?: string }
        message.error(errObj?.message || '网络错误，获取订单列表失败')
      } finally {
        setLoading(false)
      }
    },
    [filterForm, message],
  )

  // 初始加载
  useEffect(() => {
    fetchOrders(1, 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 查询 / 重置 ────────────────────────────────────────────────────────────
  const handleSearch = () => {
    fetchOrders(1, pagination.pageSize as number)
  }

  const handleReset = () => {
    filterForm.resetFields()
    fetchOrders(1, pagination.pageSize as number)
  }

  // ── 分页切换 ───────────────────────────────────────────────────────────────
  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchOrders(pag.current ?? 1, pag.pageSize ?? 10)
  }

  // ── 快捷操作：办理入住 ──────────────────────────────────────────────────────
  const handleQuickCheckIn = useCallback(
    async (record: IOrderRecord) => {
      try {
        const res = await orderApi.updateOrder({
          order_id: record.order_id,
          status: ORDER_STATUS.CHECKED_IN,
        })
        if (res?.code === 200) {
          message.success('已成功办理入住')
          fetchOrders(pagination.current as number, pagination.pageSize as number)
        } else {
          message.error(res?.message || '操作失败')
        }
      } catch {
        message.error('网络错误，操作失败')
      }
    },
    [message, fetchOrders, pagination],
  )

  // ── 快捷操作：标记完成 ──────────────────────────────────────────────────────
  const handleQuickComplete = useCallback(
    async (record: IOrderRecord) => {
      try {
        const res = await orderApi.updateOrder({
          order_id: record.order_id,
          status: ORDER_STATUS.COMPLETED,
        })
        if (res?.code === 200) {
          message.success('订单已标记为完成')
          fetchOrders(pagination.current as number, pagination.pageSize as number)
        } else {
          message.error(res?.message || '操作失败')
        }
      } catch {
        message.error('网络错误，操作失败')
      }
    },
    [message, fetchOrders, pagination],
  )

  // ── 打开编辑弹窗 ───────────────────────────────────────────────────────────
  const handleOpenEdit = useCallback(
    (record: IOrderRecord) => {
      setEditTarget(record)
      editForm.setFieldsValue({
        status: record.status as OrderStatusValue,
        check_in: record.check_in ? dayjs(record.check_in) : null,
        check_out: record.check_out ? dayjs(record.check_out) : null,
      })
      setEditVisible(true)
    },
    [editForm],
  )

  // ── 提交编辑 ───────────────────────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!editTarget) return

    let values: EditFormValues
    try {
      values = await editForm.validateFields()
    } catch {
      return // 验证失败，不提交
    }

    const payload: Parameters<typeof orderApi.updateOrder>[0] = {
      order_id: editTarget.order_id,
      status: values.status,
    }

    if (values.check_in) {
      payload.check_in = values.check_in.format('YYYY-MM-DD HH:mm:ss')
    }
    if (values.check_out) {
      payload.check_out = values.check_out.format('YYYY-MM-DD HH:mm:ss')
    }

    try {
      const res = await orderApi.updateOrder(payload)
      if (res?.code === 200) {
        message.success('订单信息已更新')
        setEditVisible(false)
        fetchOrders(pagination.current as number, pagination.pageSize as number)
      } else {
        message.error(res?.message || '更新失败')
      }
    } catch {
      message.error('网络错误，更新失败')
    }
  }

  // ── 表格列定义 ─────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnsType<IOrderRecord>>(
    () => [
      {
        title: '订单号',
        dataIndex: 'order_id',
        key: 'order_id',
        width: 200,
        render: (id: string) => <span className={styles.orderId}>{id}</span>,
      },
      {
        title: '酒店 / 房型',
        key: 'hotel',
        width: 200,
        render: (_: unknown, record: IOrderRecord) => (
          <div className={styles.hotelInfo}>
            <p className={styles.hotelName}>{record.hotel_name}</p>
            <p className={styles.roomType}>
              {record.room_name}{' '}
              <span style={{ color: '#6b7280' }}>x {record.room_count || 1} 间</span>
            </p>
            {record.special_request && (
              <Tooltip title={record.special_request}>
                <Tag color="purple" style={{ marginTop: 4 }}>
                  有特殊要求
                </Tag>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        title: '住客信息',
        key: 'guest_info',
        width: 150,
        render: (_: unknown, record: IOrderRecord) => {
          let guests: string[] = []
          if (Array.isArray(record.idcards)) {
            guests = record.idcards
          } else if (typeof record.idcards === 'string') {
            try {
              guests = JSON.parse(record.idcards)
            } catch {
              guests = []
            }
          }
          if (!guests.length) return <span style={{ color: '#9ca3af' }}>未填写</span>
          return (
            <Space size={[0, 4]} wrap>
              {guests.map((name, i) => (
                <Tag key={i} color="blue">
                  {name}
                </Tag>
              ))}
            </Space>
          )
        },
      },
      {
        title: '入住 / 退房时间',
        key: 'dates',
        width: 240,
        render: (_: unknown, record: IOrderRecord) => {
          const checkIn = record.check_in ? dayjs(record.check_in).format('YYYY-MM-DD') : '-'
          const checkOut = record.check_out ? dayjs(record.check_out).format('YYYY-MM-DD') : '-'
          const nights =
            record.check_in && record.check_out
              ? dayjs(record.check_out).diff(dayjs(record.check_in), 'day')
              : 0
          return (
            <div className={styles.dateInfo}>
              <p className={styles.dateRange}>
                {checkIn} / {checkOut}
              </p>
              {nights > 0 && <p className={styles.nights}>{record.nights || nights} 晚</p>}
            </div>
          )
        },
      },
      {
        title: '金额',
        key: 'price',
        width: 140,
        render: (_: unknown, record: IOrderRecord) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#9ca3af', fontSize: 13 }}>
              总价: ¥
              {Number(record.total_price).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
            <span className={styles.amount} style={{ fontWeight: 'bold', color: '#f5222d' }}>
              实付: ¥
              {Number(record.real_pay || record.total_price).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: number) => {
          const cfg = STATUS_CONFIG[status as OrderStatusValue]
          if (!cfg) return <Tag>{status}</Tag>
          return <StatusTag color={cfg.tagColor} statusText={cfg.text} />
        },
      },
      {
        title: '操作',
        key: 'action',
        align: 'right',
        width: 160,
        render: (_: unknown, record: IOrderRecord) => (
          <Space size={6}>
            {/* 快捷状态操作按钮 */}
            {record.status === ORDER_STATUS.PAID && (
              <Button
                type="primary"
                size="small"
                className={styles.actionCheckIn}
                onClick={() => handleQuickCheckIn(record)}
              >
                办理入住
              </Button>
            )}
            {record.status === ORDER_STATUS.CHECKED_IN && (
              <Button
                size="small"
                className={styles.actionComplete}
                onClick={() => handleQuickComplete(record)}
              >
                标记完成
              </Button>
            )}

            {/* 通用编辑按钮 */}
            <Tooltip title="手工编辑订单">
              <Button
                size="small"
                icon={<EditOutlined />}
                className={styles.actionEdit}
                onClick={() => handleOpenEdit(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [handleQuickCheckIn, handleQuickComplete, handleOpenEdit],
  )

  // ── 渲染 ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* 过滤栏 */}
        <div className={styles.filterCard}>
          <Form form={filterForm} layout="vertical">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                alignItems: 'end',
              }}
            >
              <Form.Item label="订单状态" name="status" initialValue="">
                <Select options={STATUS_FILTER_OPTIONS} />
              </Form.Item>

              <Form.Item label="入住日期范围" name="dateRange">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="关键词搜索" name="keyword">
                <Input
                  prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="搜索订单号"
                  allowClear
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

        {/* 订单表格 */}
        <div className={styles.tableCard}>
          <Table<IOrderRecord>
            columns={columns}
            dataSource={orders}
            rowKey="order_id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </div>

        <div className={styles.footer}>© 2026 易宿酒店管理平台。保留所有权利。</div>
      </div>

      {/* ── 编辑订单弹窗 ── */}
      <FormModal
        title={
          <span>
            手工编辑订单 <span className={styles.modalOrderId}>{editTarget?.order_id}</span>
          </span>
        }
        open={editVisible}
        onFinish={handleEditSubmit}
        onCancel={() => setEditVisible(false)}
        okText="保存修改"
        cancelText="取消"
        destroyOnHidden
        width={480}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="订单状态"
            name="status"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select options={STATUS_EDIT_OPTIONS} placeholder="请选择状态" />
          </Form.Item>

          <Form.Item
            label="入住时间"
            name="check_in"
            rules={[{ required: true, message: '请选择入住时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder="选择入住时间"
            />
          </Form.Item>

          <Form.Item
            label="退房时间"
            name="check_out"
            rules={[
              { required: true, message: '请选择退房时间' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    !getFieldValue('check_in') ||
                    value.isAfter(getFieldValue('check_in'))
                  ) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('退房时间必须晚于入住时间'))
                },
              }),
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder="选择退房时间"
            />
          </Form.Item>
        </Form>
      </FormModal>
    </div>
  )
}

export default OrderList
