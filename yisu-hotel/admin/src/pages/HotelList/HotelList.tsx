import React, { useState, useEffect } from 'react'
import {
  Table,
  Tag,
  Button,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  App,
  Upload,
  Descriptions,
  Image,
  Popconfirm,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import {
  PlusOutlined,
  HomeOutlined,
  BankOutlined,
  ShopOutlined,
  CoffeeOutlined,
  ApartmentOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { HotelStatus, type IHotel } from '@yisu/shared'
import styles from './HotelList.module.scss'
import { merchantApi } from '../../api/merchant'

// Hotel type options
const hotelTypeOptions = [
  { label: '豪华型', value: '豪华型' },
  { label: '度假型', value: '度假型' },
  { label: '经济型', value: '经济型' },
  { label: '商务型', value: '商务型' },
  { label: '民宿', value: '民宿' },
]

// Star rating options
const starRatingOptions = [
  { label: '5星级', value: '5星级' },
  { label: '4星级', value: '4星级' },
  { label: '3星级', value: '3星级' },
  { label: '2星级', value: '2星级' },
  { label: '1星级', value: '1星级' },
  { label: '精选', value: '精选' },
]

// Form values type (shared between Add & Edit)
interface HotelFormValues {
  name: string
  type: string
  starRating: string
  address: string
  description?: string
}

// Parse "豪华型 · 5星级" back into { type, starRating }
const parseDescription = (desc?: string): { type?: string; starRating?: string } => {
  if (!desc) return {}
  const parts = desc.split('·').map((s) => s.trim())
  return { type: parts[0] || undefined, starRating: parts[1] || undefined }
}

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

// Generate a unique hotel ID based on current year and sequence (removed unused generateHotelId and formatDateCN)

// Status config (reused in table & edit modal)
const statusConfig: Record<HotelStatus, { color: string; text: string }> = {
  [HotelStatus.PUBLISHED]: { color: 'success', text: '已通过' },
  [HotelStatus.REJECTED]: { color: 'error', text: '已驳回' },
  [HotelStatus.PENDING]: { color: 'processing', text: '待审核' },
}

const HotelList: React.FC = () => {
  const [hotels, setHotels] = useState<IHotel[]>([])
  const [loading, setLoading] = useState(false)
  const { message, modal } = App.useApp()

  const getUserId = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        return u.user_id || u.id || 'M_001' // mock fallback
      } catch {
        return 'M_001'
      }
    }
    return 'M_001'
  }

  const fetchHotels = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await merchantApi.getMerchantHotels({ user_id: getUserId() })
      if (res && res.data) {
        const mappedData = res.data.map((h: any) => ({
          ...h,
          status:
            h.status === 1
              ? HotelStatus.PUBLISHED
              : h.status === 2
                ? HotelStatus.REJECTED
                : HotelStatus.PENDING,
          rejectionReason: h.rejection_reason || undefined,
        }))
        setHotels(mappedData)
        setPagination((prev) => ({ ...prev, total: res.data.length }))
      }
    } catch (err) {
      console.error(err)
      message.error('获取酒店列表失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchHotels()
  }, [fetchHotels])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<IHotel | null>(null) // null = Add mode
  const [confirmLoading, setConfirmLoading] = useState(false)

  const [form] = Form.useForm<HotelFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [viewingHotel, setViewingHotel] = useState<IHotel | null>(null)

  const isEditMode = editingHotel !== null

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
    modal.error({
      title: '驳回原因',
      content: reason,
      okText: '我知道了',
    })
  }

  // --- Modal handlers (Add + Edit + Detail) ---
  const handleOpenDetailModal = (hotel: IHotel) => {
    setViewingHotel(hotel)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setViewingHotel(null)
  }

  const handleEditFromDetail = () => {
    if (viewingHotel) {
      setIsDetailModalOpen(false)
      handleOpenEditModal(viewingHotel)
    }
  }

  const handleOpenAddModal = () => {
    setEditingHotel(null)
    setFileList([])
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (hotel: IHotel) => {
    setEditingHotel(hotel)
    const { type, starRating } = parseDescription(hotel.description)
    form.setFieldsValue({
      name: hotel.name,
      type,
      starRating,
      address: hotel.address || '',
      description: hotel.remark, // Map db remark to form description textarea
    })

    // Convert backend media to UploadFile format
    const initialFiles: UploadFile[] = (hotel.media || [])
      .filter((m: any) => m.media_type === 1) // Images only
      .map((m: any) => ({
        uid: m.media_id,
        name: m.media_name || 'image.png',
        status: 'done',
        url: m.url,
      }))
    setFileList(initialFiles)

    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingHotel(null)
    form.resetFields()
    setFileList([])
  }

  // --- Image Upload Handlers ---
  const handleUploadChange: UploadProps['onChange'] = (info) => {
    const newFileList = [...info.fileList]
    setFileList(newFileList)
  }

  const customUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate progress
      onProgress({ percent: 50 })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const resData = await response.json()
      onProgress({ percent: 100 })

      // Call onSuccess with the response url (so antd sets the url property correctly)
      onSuccess(resData.data.url, file)
    } catch (err) {
      onError(err)
      message.error('文件上传失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)

      const userId = getUserId()

      // Step 1: Save hotel basic info
      const res = await merchantApi.saveMerchantHotel({
        user_id: userId,
        hotel_id: editingHotel?.hotel_id,
        name: values.name,
        description: `${values.type} · ${values.starRating}`,
        address: values.address,
        star_rating: parseInt(values.starRating) || 0,
        remark: values.description,
      })

      if (!res.data || !res.data.hotel_id) {
        throw new Error(res.message || '保存酒店响应异常')
      }

      const hotelId = res.data.hotel_id

      // Step 2: Handle Media Sync
      // Determine what was deleted vs newly uploaded based on fileList state vs initial

      // Deletions: Initial files not in current fileList
      if (editingHotel && editingHotel.media) {
        const currentUids = new Set(fileList.map((f) => f.uid))
        for (const dbMedia of editingHotel.media) {
          if (dbMedia.media_type === 1 && !currentUids.has(dbMedia.media_id)) {
            await merchantApi
              .manageHotelMedia({
                user_id: userId,
                action: 'delete',
                hotel_id: hotelId,
                media_id: dbMedia.media_id,
              })
              .catch((e) => console.error('Delete media failed', e))
          }
        }
      }

      // Additions: uploaded files that do not have an initial backend ID
      // i.e., upload response urls
      const newFiles = fileList.filter((f) => f.response)
      for (const [index, f] of newFiles.entries()) {
        const url = typeof f.response === 'string' ? f.response : (f.response as any)?.data?.url
        if (!url) continue

        await merchantApi
          .manageHotelMedia({
            user_id: userId,
            action: 'add',
            hotel_id: hotelId,
            media_type: 1,
            url: url,
            sort_order: index,
            media_name: f.name,
          })
          .catch((e) => console.error('Add media failed', e))
      }

      message.success(
        isEditMode ? `酒店"${values.name}"的信息已更新` : `酒店"${values.name}"已成功添加`,
      )

      // Refresh list
      fetchHotels()
      handleCloseModal()
    } catch (err: any) {
      if (err?.errorFields) {
        // Form validation failed - do nothing
      } else {
        message.error(err.message || '操作失败')
      }
    } finally {
      setConfirmLoading(false)
    }
  }
  const handleDeleteHotel = async (hotel: IHotel) => {
    try {
      setLoading(true)
      await merchantApi.deleteMerchantHotel({
        user_id: getUserId(),
        hotel_id: String(hotel.hotel_id),
      })
      message.success(`酒店"${hotel.name}"删除成功`)
      fetchHotels()
    } catch (err: any) {
      console.error(err)
      message.error(err.message || '删除失败')
      setLoading(false)
    }
  }

  const columns: ColumnsType<IHotel> = [
    {
      title: '酒店ID',
      dataIndex: 'hotel_id',
      key: 'hotel_id',
      width: 140,
      render: (id: string) => <span className={styles.hotelId}>{id}</span>,
    },
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (_: string, record: IHotel) => {
        // Find first image
        const img = record.media?.find((m: any) => m.media_type === 1)

        return (
          <div className={styles.hotelInfo}>
            {img && img.url ? (
              <img src={img.url} alt="hotel" className={styles.coverImage} />
            ) : (
              <div className={styles.iconWrapper}>{getHotelIcon(String(record.hotel_id))}</div>
            )}
            <div className={styles.details}>
              <p className={styles.name}>{record.name}</p>
              {record.description && <p className={styles.desc}>{record.description}</p>}
            </div>
          </div>
        )
      },
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

        return (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleOpenDetailModal(record)}
            >
              详情
            </button>
            {isRejected && record.rejectionReason && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={() => handleViewReason(record.rejectionReason!)}
              >
                查看原因
              </button>
            )}
            <Popconfirm
              title="确定要删除该酒店吗？"
              description="删除后将无法恢复（包括已关联的客房或图片）。"
              onConfirm={() => handleDeleteHotel(record)}
              okText="确定删除"
              cancelText="取消"
            >
              <button type="button" className={`${styles.actionBtn} ${styles.danger}`}>
                删除
              </button>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  // --- Modal title with status badge for Edit mode ---
  const modalTitle = isEditMode ? (
    <div className={styles.editModalTitle}>
      <EditOutlined className={styles.editTitleIcon} />
      <span>编辑酒店详情</span>
      <Tag
        color={statusConfig[editingHotel.status].color}
        style={{ borderRadius: 12, padding: '0 10px', marginLeft: 12 }}
      >
        <span style={{ marginRight: 4 }}>•</span>
        {statusConfig[editingHotel.status].text}
      </Tag>
    </div>
  ) : (
    '添加新酒店'
  )

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <div className={styles.pageHeader}>
          <h2>我的酒店</h2>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleOpenAddModal}>
            添加新酒店
          </Button>
        </div>

        <div className={styles.tableCard}>
          <Table<IHotel>
            loading={loading}
            columns={columns}
            dataSource={hotels}
            rowKey="hotel_id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
          />
        </div>

        <div className={styles.footer}>© 2026 易宿酒店平台。保留所有权利。</div>
      </div>

      {/* Add / Edit Hotel Modal */}
      <Modal
        title={modalTitle}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={confirmLoading}
        okText={isEditMode ? '保存修改' : '确认添加'}
        cancelText="取消"
        width={560}
        forceRender
        className={styles.addHotelModal}
      >
        {/* Edit mode: show hotel ID and submission date */}
        {isEditMode && (
          <div className={styles.editInfoBar}>
            <span className={styles.editInfoItem}>
              <span className={styles.editInfoLabel}>酒店ID</span>
              <span className={styles.editInfoValue}>{editingHotel.hotel_id}</span>
            </span>
            <span className={styles.editInfoDivider} />
            <span className={styles.editInfoItem}>
              <span className={styles.editInfoLabel}>提交日期</span>
              <span className={styles.editInfoValue}>{editingHotel.submissionDate}</span>
            </span>
          </div>
        )}

        <Form form={form} layout="vertical" requiredMark="optional" className={styles.addHotelForm}>
          <Form.Item
            label="酒店名称"
            name="name"
            rules={[
              { required: true, message: '请输入酒店名称' },
              { max: 50, message: '酒店名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入酒店名称" maxLength={50} showCount />
          </Form.Item>

          <div className={styles.formRow}>
            <Form.Item
              label="酒店类型"
              name="type"
              rules={[{ required: true, message: '请选择酒店类型' }]}
              className={styles.formRowItem}
            >
              <Select placeholder="请选择类型" options={hotelTypeOptions} />
            </Form.Item>

            <Form.Item
              label="星级"
              name="starRating"
              rules={[{ required: true, message: '请选择星级' }]}
              className={styles.formRowItem}
            >
              <Select placeholder="请选择星级" options={starRatingOptions} />
            </Form.Item>
          </div>

          <Form.Item
            label="酒店地址"
            name="address"
            rules={[
              { required: true, message: '请输入酒店地址' },
              { max: 100, message: '地址不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入详细地址，如：北京市朝阳区建国路88号" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="详细描述"
            name="description"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入酒店描述信息（选填）"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item label="酒店图片 (由服务器图库提供响应支持)">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              customRequest={customUpload}
              accept="image/*"
            >
              {fileList.length >= 8 ? null : (
                <div
                  style={{
                    padding: 4,
                    minHeight: 90,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
                  <div style={{ marginTop: 8, color: '#666' }}>点击上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>

        {/* Edit mode: show rejection reason if exists */}
        {isEditMode &&
          editingHotel.status === HotelStatus.REJECTED &&
          editingHotel.rejectionReason && (
            <div className={styles.rejectionNotice}>
              <div className={styles.rejectionTitle}>驳回原因</div>
              <div className={styles.rejectionContent}>{editingHotel.rejectionReason}</div>
            </div>
          )}
      </Modal>

      {/* Hotel Detail Modal */}
      <Modal
        title="酒店详情"
        open={isDetailModalOpen}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key="close" onClick={handleCloseDetailModal}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={handleEditFromDetail}>
            编辑酒店详情
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        {viewingHotel && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="酒店名称" span={2}>
              <strong>{viewingHotel.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="酒店地址" span={2}>
              {viewingHotel.address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="酒店类型">
              {parseDescription(viewingHotel.description).type || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="酒店星级">
              {parseDescription(viewingHotel.description).starRating || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核状态">
              <Tag color={statusConfig[viewingHotel.status]?.color}>
                {statusConfig[viewingHotel.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="建档日期">
              {viewingHotel.created_at
                ? new Date(viewingHotel.created_at).toLocaleDateString()
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="图文介绍" span={2}>
              {viewingHotel.remark || '（无）'}
            </Descriptions.Item>
            <Descriptions.Item label="酒店图片/图库" span={2}>
              {viewingHotel.media && viewingHotel.media.length > 0 ? (
                <Image.PreviewGroup>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {viewingHotel.media
                      .filter((m: any) => m.media_type === 1)
                      .map((m: any) => (
                        <Image
                          key={m.media_id}
                          src={m.url}
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover' }}
                        />
                      ))}
                  </div>
                </Image.PreviewGroup>
              ) : (
                <span style={{ color: '#999' }}>暂无图片</span>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default HotelList
