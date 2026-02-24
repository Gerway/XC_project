import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Select, Empty, Modal, Form, Input, InputNumber, App, Switch, Row, Col, Upload } from 'antd'
import { ShopOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { type IHotel } from '@yisu/shared'
import RoomList from './RoomList'
import InventoryCalendar from './InventoryCalendar'
import styles from './Inventory.module.scss'
import { merchantApi } from '../../api/merchant'
import { roomApi, type IRoomWithStock } from '../../api/room'

const InventoryContainer: React.FC = () => {
  const currentUserId = useMemo(() => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    return user?.user_id || user?.id || ''
  }, [])

  const [hotels, setHotels] = useState<Pick<IHotel, 'hotel_id' | 'name'>[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string | undefined>(undefined)

  const [rooms, setRooms] = useState<IRoomWithStock[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  // Create room modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()

  const { message, modal } = App.useApp()

  // Room image upload state
  const [roomFileList, setRoomFileList] = useState<UploadFile[]>([])

  // Fetch hotels on mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await merchantApi.getMerchantHotels({ user_id: currentUserId })
        if (res && res.data) {
          setHotels(res.data || [])
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          message.error(err.message || '获取酒店列表失败')
        } else {
          message.error('获取酒店列表失败')
        }
      }
    }
    fetchHotels()
  }, [message, currentUserId])

  // Fetch rooms when hotel selected
  const fetchRooms = useCallback(
    async (hotelId: string) => {
      try {
        const res = await roomApi.getMerchantRoomList({
          user_id: currentUserId,
          hotel_id: hotelId,
        })
        if (res.code === 200) {
          const data = res.data || []
          setRooms(data)
          if (data.length > 0) {
            setSelectedRoomId(data[0].room_id)
          } else {
            setSelectedRoomId(null)
          }
        } else {
          message.error(res.message || '获取房型列表失败')
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          message.error(err.message || '获取房型列表失败')
        } else {
          message.error('获取房型列表失败')
        }
      }
    },
    [message, currentUserId],
  )

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId)
    fetchRooms(hotelId)
  }

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.room_id === selectedRoomId) || null,
    [rooms, selectedRoomId],
  )

  // Handlers for room creation/deletion
  const handleCreateRoom = () => {
    setCreateModalOpen(true)
  }

  const handleDeleteRoom = (room: IRoomWithStock) => {
    if (!selectedHotelId) return
    modal.confirm({
      title: '确认删除房型',
      content: `确定要删除房型「${room.name}」吗？相关库存数据也将一并清除，此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await roomApi.deleteRoom({
            user_id: currentUserId,
            hotel_id: selectedHotelId,
            room_id: room.room_id,
          })
          if (res.code === 200) {
            message.success('房型删除成功')
            fetchRooms(selectedHotelId)
          } else {
            message.error(res.message || '删除失败')
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            message.error(err.message || '删除房型失败')
          } else {
            message.error('删除房型失败')
          }
        }
      },
    })
  }

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields()
      if (!selectedHotelId) return

      // Collect uploaded image URLs
      const roomPhotos = roomFileList
        .filter((f) => f.status === 'done' && f.response)
        .map((f) => f.response as string)

      const payload = {
        user_id: currentUserId,
        hotel_id: selectedHotelId,
        name: values.name,
        ori_price: values.ori_price,
        max_occupancy: values.max_occupancy,
        room_type: values.room_type,
        has_breakfast: values.has_breakfast,
        area: values.area,
        floor: values.floor,
        has_window: values.has_window,
        add_bed: values.add_bed,
        has_wifi: values.has_wifi,
        remark: values.remark,
        room_bed: values.room_bed,
        room_photos: roomPhotos.length > 0 ? roomPhotos : undefined,
      }

      const res = await roomApi.createRoom(payload)
      if (res.code === 200) {
        message.success(`房型「${values.name}」创建成功`)
        setCreateModalOpen(false)
        createForm.resetFields()
        setRoomFileList([])
        fetchRooms(selectedHotelId)
      } else {
        message.error(res.message || '创建房型失败')
      }
    } catch (err: unknown) {
      // This catch block handles errors from validateFields or roomApi.createRoom
      if (err instanceof Error) {
        // If it's a validation error, Ant Design usually shows it on the form.
        // For other errors (e.g., network), we show a generic message.
        if (!('errorFields' in err)) {
          // Check if it's not a Form validation error object
          message.error(err.message || '操作失败')
        }
      } else {
        message.error('操作失败')
      }
    }
  }

  // Handle single-day inventory update
  // No explicit day update function from parent. Calendar fetches its own inventory.

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.hotel_id === selectedHotelId),
    [selectedHotelId, hotels],
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
            options={hotels.map((h) => ({
              value: h.hotel_id,
              label: (
                <span>
                  <strong>{h.name}</strong>
                </span>
              ),
            }))}
          />
        </div>
        {selectedHotel && (
          <div className={styles.hotelSelectorMeta}>
            <span className={styles.hotelMetaId}>{selectedHotel.hotel_id}</span>
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
            onCreateRoom={handleCreateRoom}
            onDeleteRoom={handleDeleteRoom}
          />
          <InventoryCalendar room={selectedRoom} />
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

      {/* Create Room Modal */}
      <Modal
        title="新增房型"
        open={createModalOpen}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateModalOpen(false)
          createForm.resetFields()
          setRoomFileList([])
        }}
        okText="创建房型"
        cancelText="取消"
        forceRender
        className={styles.modal}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="房型名称"
                name="name"
                rules={[
                  { required: true, message: '请输入房型名称' },
                  { max: 30, message: '房型名称不能超过30个字符' },
                ]}
              >
                <Input placeholder="例: 豪华大床房" maxLength={30} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="房型类型"
                name="room_type"
                initialValue={1}
                rules={[{ required: true, message: '请选择房型类型' }]}
              >
                <Select
                  options={[
                    { value: 1, label: '大床房' },
                    { value: 2, label: '双床房' },
                    { value: 3, label: '单人房' },
                    { value: 4, label: '多床房' },
                    { value: 5, label: '套房' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="门市价格 (¥)"
                name="ori_price"
                rules={[{ required: true, message: '请输入基础门市价格' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="例: 599" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="最大入住人数"
                name="max_occupancy"
                initialValue={2}
                rules={[{ required: true, message: '请输入人数' }]}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="例: 2" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="面积 (㎡)" name="area" initialValue={20}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="例: 35" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="所在楼层" name="floor">
                <Input placeholder="例: 10,11,12" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="床型信息" name="room_bed">
                <Input placeholder="例: 1*1.8m大床" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="含早餐"
                name="has_breakfast"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="有窗" name="has_window" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="可加床" name="add_bed" valuePropName="checked" initialValue={false}>
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="独立WiFi"
                name="has_wifi"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="房型图片">
            <Upload
              listType="picture-card"
              fileList={roomFileList}
              onChange={(info) => setRoomFileList([...info.fileList])}
              customRequest={async (options) => {
                const { file, onSuccess, onError, onProgress } = options as {
                  file: File
                  onSuccess: (body: string, xhr?: XMLHttpRequest) => void
                  onError: (err: Error) => void
                  onProgress: (event: { percent: number }) => void
                }
                const formData = new FormData()
                formData.append('file', file)
                try {
                  onProgress({ percent: 50 })
                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  })
                  if (!response.ok) throw new Error('Upload failed')
                  const resData = await response.json()
                  onProgress({ percent: 100 })
                  onSuccess(resData.data.url)
                } catch (err) {
                  onError(err as Error)
                  message.error('图片上传失败')
                }
              }}
              accept="image/*"
            >
              {roomFileList.length >= 6 ? null : (
                <div style={{ textAlign: 'center' }}>
                  <PlusOutlined style={{ fontSize: 20, color: '#999' }} />
                  <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="房型备注" name="remark">
            <Input.TextArea
              placeholder="例: 无烟处理，带阳台等"
              rows={2}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InventoryContainer
