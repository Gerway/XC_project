import React, { useState, useMemo, useCallback } from 'react'
import { Select, Empty, Modal, Form, Input, InputNumber, Switch, App } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import { HotelStatus, type IHotel, type IRoom, type IDayInventory } from '@yisu/shared'
import RoomList from './RoomList'
import InventoryCalendar from './InventoryCalendar'
import styles from './Inventory.module.scss'

// ===== Mock Data =====

// Mock hotels (only PUBLISHED hotels can be managed)
const mockHotels: Pick<IHotel, 'id' | 'name' | 'description' | 'status'>[] = [
  {
    id: 'H-2023-001',
    name: '易宿广场大酒店',
    description: '豪华型 · 5星级',
    status: HotelStatus.PUBLISHED,
  },
  {
    id: 'H-2023-012',
    name: '云端商务酒店',
    description: '商务型 · 4星级',
    status: HotelStatus.PUBLISHED,
  },
]

// Initial mock rooms per hotel
const initialRoomsByHotel: Record<string, IRoom[]> = {
  'H-2023-001': [
    { id: 'R-102', hotelId: 'H-2023-001', name: '豪华大床房', basePrice: 580, isActive: true },
    { id: 'R-103', hotelId: 'H-2023-001', name: '标准双床房', basePrice: 380, isActive: true },
    { id: 'R-105', hotelId: 'H-2023-001', name: '行政套房', basePrice: 1280, isActive: false },
    { id: 'R-108', hotelId: 'H-2023-001', name: '海景家庭房', basePrice: 880, isActive: true },
  ],
  'H-2023-012': [
    { id: 'R-201', hotelId: 'H-2023-012', name: '商务标准间', basePrice: 420, isActive: true },
    { id: 'R-202', hotelId: 'H-2023-012', name: '商务套房', basePrice: 760, isActive: true },
    { id: 'R-203', hotelId: 'H-2023-012', name: '总统套房', basePrice: 2680, isActive: false },
  ],
}

// Generate mock inventory
const generateMockInventory = (roomId: string, basePrice: number): IDayInventory[] => {
  const data: IDayInventory[] = []
  for (let day = 1; day <= 31; day++) {
    const dateStr = `2023-10-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(2023, 9, day).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const price = isWeekend ? basePrice + 100 : basePrice
    let stock = 8

    // Simulate varied stock based on room+day
    const seed = roomId.charCodeAt(roomId.length - 1) + day
    if (seed % 7 === 0) stock = 10
    if (seed % 5 === 0) stock = 5
    if (seed % 11 === 0) stock = 1
    if (seed % 13 === 0) stock = 0
    if (seed % 9 === 0) stock = 2

    data.push({ date: dateStr, price, stock })
  }
  return data
}

const InventoryContainer: React.FC = () => {
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>(undefined)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [roomsByHotel, setRoomsByHotel] = useState<Record<string, IRoom[]>>(initialRoomsByHotel)
  const [inventoryCache, setInventoryCache] = useState<Record<string, IDayInventory[]>>({})

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<IRoom | null>(null)
  const [editForm] = Form.useForm()
  const { message } = App.useApp()

  // Available rooms for selected hotel
  const rooms = useMemo(() => {
    if (!selectedHotelId) return []
    return roomsByHotel[selectedHotelId] || []
  }, [selectedHotelId, roomsByHotel])

  // Auto-select first room when hotel changes
  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId)
    const hotelRooms = roomsByHotel[hotelId] || []
    setSelectedRoomId(hotelRooms.length > 0 ? hotelRooms[0].id : null)
  }

  // Edit room handlers
  const handleEditRoom = (room: IRoom) => {
    setEditingRoom(room)
    editForm.setFieldsValue({
      name: room.name,
      basePrice: room.basePrice,
      isActive: room.isActive,
    })
    setEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      if (!editingRoom || !selectedHotelId) return

      setRoomsByHotel((prev) => ({
        ...prev,
        [selectedHotelId]: (prev[selectedHotelId] || []).map((r) =>
          r.id === editingRoom.id
            ? { ...r, name: values.name, basePrice: values.basePrice, isActive: values.isActive }
            : r,
        ),
      }))

      message.success(`房型「${values.name}」已更新`)
      setEditModalOpen(false)
      setEditingRoom(null)
      editForm.resetFields()
    } catch {
      // Form validation errors shown by antd
    }
  }

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || null,
    [rooms, selectedRoomId],
  )

  // Lazy-initialize inventory cache when room changes
  React.useEffect(() => {
    if (selectedRoom && !inventoryCache[selectedRoom.id]) {
      setInventoryCache((prev) => ({
        ...prev,
        [selectedRoom.id]: generateMockInventory(selectedRoom.id, selectedRoom.basePrice),
      }))
    }
  }, [selectedRoom, inventoryCache])

  const inventoryData = useMemo(
    () => (selectedRoom ? inventoryCache[selectedRoom.id] || [] : []),
    [selectedRoom, inventoryCache],
  )

  // Handle single-day inventory update
  const handleUpdateDay = useCallback(
    (date: string, price: number, stock: number) => {
      if (!selectedRoom) return
      const key = selectedRoom.id
      setInventoryCache((prev) => ({
        ...prev,
        [key]: (prev[key] || []).map((d) => (d.date === date ? { ...d, price, stock } : d)),
      }))
    },
    [selectedRoom],
  )

  const selectedHotel = useMemo(
    () => mockHotels.find((h) => h.id === selectedHotelId),
    [selectedHotelId],
  )

  return (
    <div className={styles.container}>
      {/* Hotel Selector Bar */}
      <div className={styles.hotelSelectorBar}>
        <div className={styles.hotelSelectorLeft}>
          <ShopOutlined className={styles.hotelSelectorIcon} />
          <span className={styles.hotelSelectorLabel}>当前酒店</span>
          <Select
            placeholder="请选择要管理的酒店"
            value={selectedHotelId}
            onChange={handleHotelChange}
            style={{ width: 280 }}
            size="large"
            options={mockHotels.map((h) => ({
              value: h.id,
              label: (
                <span>
                  <strong>{h.name}</strong>
                  <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>
                    {h.description}
                  </span>
                </span>
              ),
            }))}
          />
        </div>
        {selectedHotel && (
          <div className={styles.hotelSelectorMeta}>
            <span className={styles.hotelMetaId}>{selectedHotel.id}</span>
            <span className={styles.hotelMetaDesc}>{selectedHotel.description}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      {selectedHotelId ? (
        <div className={styles.splitView}>
          <RoomList
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            onEditRoom={handleEditRoom}
          />
          <InventoryCalendar
            room={selectedRoom}
            inventoryData={inventoryData}
            onUpdateDay={handleUpdateDay}
          />
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className={styles.emptyContent}>
                <p className={styles.emptyTitle}>请先选择酒店</p>
                <p className={styles.emptyDesc}>
                  从上方下拉框中选择要管理的酒店，即可查看和管理该酒店的房型与库存信息
                </p>
              </div>
            }
          />
        </div>
      )}

      <div className={styles.footer}>© 2026 易宿酒店平台。保留所有权利。</div>

      {/* Edit Room Modal */}
      <Modal
        title={
          editingRoom ? (
            <span>
              编辑房型{' '}
              <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 400 }}>
                ({editingRoom.id})
              </span>
            </span>
          ) : (
            '编辑房型'
          )
        }
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRoom(null)
          editForm.resetFields()
        }}
        okText="保存修改"
        cancelText="取消"
        destroyOnHidden
        className={styles.modal}
      >
        <Form form={editForm} layout="vertical" requiredMark="optional" style={{ marginTop: 16 }}>
          <Form.Item
            label="房型名称"
            name="name"
            rules={[
              { required: true, message: '请输入房型名称' },
              { max: 30, message: '房型名称不能超过30个字符' },
            ]}
          >
            <Input placeholder="请输入房型名称" maxLength={30} />
          </Form.Item>
          <Form.Item
            label="基础价格 (¥)"
            name="basePrice"
            rules={[{ required: true, message: '请输入基础价格' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入价格" />
          </Form.Item>
          <Form.Item label="上架状态" name="isActive" valuePropName="checked">
            <Switch checkedChildren="在售" unCheckedChildren="下架" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InventoryContainer
