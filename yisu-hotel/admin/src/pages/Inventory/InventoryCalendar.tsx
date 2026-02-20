import React, { useState, useMemo } from 'react'
import { Button, Modal, DatePicker, Checkbox, InputNumber, Form, message } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  SettingOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { IRoom, IDayInventory } from '@yisu/shared'
import styles from './Inventory.module.scss'

const { RangePicker } = DatePicker

interface InventoryCalendarProps {
  room: IRoom | null
  inventoryData: IDayInventory[]
  onUpdateDay?: (date: string, price: number, stock: number) => void
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

const InventoryCalendar: React.FC<InventoryCalendarProps> = ({
  room,
  inventoryData,
  onUpdateDay,
}) => {
  const [currentYear, setCurrentYear] = useState(2023)
  const [currentMonth, setCurrentMonth] = useState(10) // 1-indexed
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [form] = Form.useForm()

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
      const inv = inventoryData.find((d) => d.date === dateStr)
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
      .then((values) => {
        console.log('Batch settings:', values)
        message.success('批量设置成功（演示）')
        setBatchModalOpen(false)
        form.resetFields()
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
      .then((values) => {
        if (editingDate && onUpdateDay) {
          onUpdateDay(editingDate, values.price, values.stock)
        }
        message.success(`${editingDate} 库存已更新`)
        setDayEditOpen(false)
        setEditingDate(null)
        dayForm.resetFields()
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
          <Button icon={<ReloadOutlined />}>刷新</Button>
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
                      onClick={(e) => {
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
        <Form form={form} layout="vertical" className={styles.batchForm}>
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
          <Form.Item label="设置价格 (¥)" name="price">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="留空则不修改" />
          </Form.Item>
          <Form.Item label="设置库存" name="stock">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="留空则不修改" />
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
        destroyOnClose
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
