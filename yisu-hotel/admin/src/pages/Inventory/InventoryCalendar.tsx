import React, { useState, useMemo, useCallback } from 'react'
import { Button, Modal, DatePicker, Checkbox, InputNumber, Form, App, Select } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  SettingOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { IDayInventory } from '@yisu/shared'
import { roomApi, type IRoomWithStock } from '../../api/room'
import { merchantApi } from '../../api/merchant'
import styles from './Inventory.module.scss'

const { RangePicker } = DatePicker

interface InventoryCalendarProps {
  room: IRoomWithStock | null
}

interface CalendarCell {
  day: number
  isCurrentMonth: boolean
  date: string // YYYY-MM-DD
  inventory?: IDayInventory
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const WEEKDAY_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
]

const InventoryCalendar: React.FC<InventoryCalendarProps> = ({ room }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1) // 1-indexed
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [form] = Form.useForm()

  const [inventoryData, setInventoryData] = useState<IDayInventory[]>([])

  const currentUserId = useMemo(() => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    return user?.user_id || 'U-TEST-001'
  }, [])

  const { message } = App.useApp()

  // Fetch data
  const fetchInventory = useCallback(async () => {
    if (!room || !currentUserId) {
      setInventoryData([])
      return
    }

    const lastDay = new Date(currentYear, currentMonth, 0)
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

    try {
      const response = await merchantApi.getInventory({
        user_id: currentUserId,
        room_id: room.room_id,
        startDate,
        endDate,
      })
      // Based on typical axios interceptors where code is un-wrapped, OR if backend doesn't return code
      const dataToSet = (response as { data?: unknown }).data || response || []
      setInventoryData(Array.isArray(dataToSet) ? (dataToSet as IDayInventory[]) : [])
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message || '获取库存日历失败')
      } else {
        message.error('获取库存日历失败')
      }
    }
  }, [room, currentUserId, currentYear, currentMonth, message])

  React.useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Day edit modal state
  const [dayEditOpen, setDayEditOpen] = useState(false)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [dayForm] = Form.useForm()

  // Build calendar grid
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const cells: CalendarCell[] = []

    // First day of current month (0=Sun, 1=Mon, ...)
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
    // Days in current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    // Days in previous month
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate()

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const prevMonth = currentMonth - 1
      const prevYear = prevMonth <= 0 ? currentYear - 1 : currentYear
      const m = prevMonth <= 0 ? 12 : prevMonth
      const dateStr = `${prevYear}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ day, isCurrentMonth: false, date: dateStr })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const inv = inventoryData.find((d) => d.date && d.date.startsWith(dateStr))
      cells.push({ day, isCurrentMonth: true, date: dateStr, inventory: inv })
    }

    // Next month fill (to complete 6 rows × 7 cols = 42 cells, or at least fill the last row)
    const totalNeeded = Math.ceil(cells.length / 7) * 7
    const remaining = totalNeeded - cells.length
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth + 1
      const nextYear = nextMonth > 12 ? currentYear + 1 : currentYear
      const m = nextMonth > 12 ? 1 : nextMonth
      const dateStr = `${nextYear}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ day, isCurrentMonth: false, date: dateStr })
    }

    return cells
  }, [currentYear, currentMonth, inventoryData])

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1)
      setCurrentMonth(12)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1)
      setCurrentMonth(1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleBatchSubmit = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (!room || !currentUserId) return
        if (!room.hotel_id) {
          message.error('由于房型数据中缺少 hotel_id，无法执行批量操作。')
          return
        }

        const [start, end] = values.dateRange || []
        if (!start || !end) return

        const start_date = start.format('YYYY-MM-DD')
        const end_date = end.format('YYYY-MM-DD')
        const price =
          values.price !== undefined && values.price !== null ? Number(values.price) : undefined
        const stock =
          values.stock !== undefined && values.stock !== null ? Number(values.stock) : undefined
        const operationType = values.operationType

        let promise = null
        if (operationType === 'add') {
          if (price === undefined || stock === undefined) {
            message.error('新增库存必须填写价格和库存数量')
            return
          }
          promise = roomApi.addRoomInventory({
            user_id: currentUserId,
            hotel_id: room.hotel_id,
            room_id: room.room_id,
            start_date,
            end_date,
            weekdays: values.weekdays,
            price,
            stock,
          })
        } else if (operationType === 'update') {
          if (price === undefined && stock === undefined) {
            message.error('修改库存必须至少填写价格或库存数量之一')
            return
          }
          promise = roomApi.batchUpdateRoomInventory({
            user_id: currentUserId,
            hotel_id: room.hotel_id,
            room_id: room.room_id,
            start_date,
            end_date,
            weekdays: values.weekdays,
            price,
            stock,
          })
        } else if (operationType === 'clear') {
          promise = roomApi.deleteRoomInventory({
            user_id: currentUserId,
            hotel_id: room.hotel_id,
            room_id: room.room_id,
            start_date,
            end_date,
            weekdays: values.weekdays,
          })
        }

        if (promise) {
          try {
            const res = await promise
            if (res.code === 200) {
              message.success(res.message || '操作成功')
              setBatchModalOpen(false)
              form.resetFields()
              fetchInventory()
            } else {
              message.error(res.message || '操作失败')
            }
          } catch (err: unknown) {
            if (err instanceof Error) {
              message.error(err.message || '操作失败')
            } else {
              message.error('操作失败')
            }
          }
        }
      })
      .catch(() => {
        // validation errors shown by form
      })
  }

  const isLowStock = (stock: number): boolean => stock <= 1

  // Day edit handlers
  const handleDayEdit = (cell: CalendarCell) => {
    if (!cell.isCurrentMonth) return
    setEditingDate(cell.date)
    dayForm.setFieldsValue({
      price: cell.inventory?.price ?? room?.basePrice ?? 0,
      stock: cell.inventory?.stock ?? 0,
    })
    setDayEditOpen(true)
  }

  const handleDayEditSubmit = () => {
    dayForm
      .validateFields()
      .then(async (values) => {
        if (!room || !currentUserId || !editingDate) return
        if (!room.hotel_id) return

        try {
          const res = await roomApi.batchUpdateRoomInventory({
            user_id: currentUserId,
            hotel_id: room.hotel_id,
            room_id: room.room_id,
            start_date: editingDate,
            end_date: editingDate,
            price: values.price,
            stock: values.stock,
          })

          if (res.code === 200) {
            message.success(`${editingDate} 库存已更新`)
            setDayEditOpen(false)
            setEditingDate(null)
            dayForm.resetFields()
            fetchInventory()
          } else {
            message.error(res.message || '更新失败')
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            message.error(err.message || '更新失败')
          } else {
            message.error('更新失败')
          }
        }
      })
      .catch(() => {})
  }

  return (
    <div className={styles.calendarPanel}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarHeaderLeft}>
          <h2>库存日历</h2>
          <div className={styles.monthSwitcher}>
            <button type="button" onClick={handlePrevMonth}>
              <LeftOutlined style={{ fontSize: 14 }} />
            </button>
            <span>
              {currentYear}年 {currentMonth}月
            </span>
            <button type="button" onClick={handleNextMonth}>
              <RightOutlined style={{ fontSize: 14 }} />
            </button>
          </div>
          {room && (
            <span className={styles.currentRoom}>
              {room.name} ({room.id})
            </span>
          )}
        </div>
        <div className={styles.calendarActions}>
          <Button icon={<ReloadOutlined />} onClick={fetchInventory}>
            刷新
          </Button>
          <Button type="primary" icon={<SettingOutlined />} onClick={() => setBatchModalOpen(true)}>
            批量设置
          </Button>
        </div>
      </div>

      <div className={styles.calendarBody}>
        <div className={styles.calendarGrid}>
          {/* Weekday Headers */}
          {WEEKDAYS.map((wd) => (
            <div key={wd} className={styles.weekdayHeader}>
              {wd}
            </div>
          ))}

          {/* Day Cells */}
          {calendarCells.map((cell, idx) => {
            const inv = cell.inventory
            const low = inv ? isLowStock(inv.stock) : false

            return (
              <div
                key={idx}
                className={`${styles.dayCell} ${!cell.isCurrentMonth ? styles.otherMonth : ''} ${low ? styles.lowStock : ''}`}
              >
                <div className={styles.dayCellTop}>
                  <span className={styles.dayNumber}>{cell.day}</span>
                  {cell.isCurrentMonth && (
                    <EditOutlined
                      className={styles.editIcon}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        handleDayEdit(cell)
                      }}
                    />
                  )}
                </div>
                {cell.isCurrentMonth && inv && (
                  <div className={styles.dayCellBottom}>
                    <div className={`${styles.priceText} ${low ? styles.danger : ''}`}>
                      价格: <span className={styles.priceValue}>¥{inv.price}</span>
                    </div>
                    <div
                      className={`${styles.stockText} ${low ? styles.danger : inv.stock >= 9 ? styles.success : ''}`}
                    >
                      库存: <span className={styles.stockValue}>{inv.stock}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Batch Settings Modal */}
      <Modal
        title="批量设置价格与库存"
        open={batchModalOpen}
        onOk={handleBatchSubmit}
        onCancel={() => setBatchModalOpen(false)}
        okText="确认设置"
        cancelText="取消"
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.batchForm}
          initialValues={{ operationType: 'update' }}
        >
          <Form.Item label="操作类型" name="operationType" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="add">新增库存（该日期之前无库存）</Select.Option>
              <Select.Option value="update">修改库存/价格（适用于已有库存日期）</Select.Option>
              <Select.Option value="clear">清空库存（将所选库存数量设为 0）</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="日期范围"
            name="dateRange"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="适用星期" name="weekdays">
            <Checkbox.Group options={WEEKDAY_OPTIONS} className={styles.weekdayGroup} />
          </Form.Item>
          <Form.Item noStyle dependencies={['operationType']}>
            {() => {
              const op = form.getFieldValue('operationType')
              if (op === 'clear') return null
              return (
                <>
                  <Form.Item label="设置价格 (¥)" name="price">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder={op === 'update' ? '留空则不修改' : '此操作必填'}
                    />
                  </Form.Item>
                  <Form.Item label="设置库存" name="stock">
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder={op === 'update' ? '留空则不修改' : '此操作必填'}
                    />
                  </Form.Item>
                </>
              )
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Single Day Edit Modal */}
      <Modal
        title={
          editingDate ? (
            <span>
              编辑库存{' '}
              <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 400 }}>{editingDate}</span>
            </span>
          ) : (
            '编辑库存'
          )
        }
        open={dayEditOpen}
        onOk={handleDayEditSubmit}
        onCancel={() => {
          setDayEditOpen(false)
          setEditingDate(null)
          dayForm.resetFields()
        }}
        okText="保存"
        cancelText="取消"
        width={400}
        forceRender
      >
        <Form form={dayForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="价格 (¥)"
            name="price"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="库存数量"
            name="stock"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InventoryCalendar
