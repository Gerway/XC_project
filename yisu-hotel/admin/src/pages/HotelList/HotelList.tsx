import React, { useState } from 'react'
import { Table, Tag, Button, Tooltip, Modal, Form, Input, Select, App } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
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

// Initial Mock Data
const initialHotels: IHotel[] = [
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

// Generate a unique hotel ID based on current year and sequence
let hotelIdCounter = 13

const generateHotelId = (): string => {
  const year = new Date().getFullYear()
  const seq = String(hotelIdCounter++).padStart(3, '0')
  return `H-${year}-${seq}`
}

// Format current date in Chinese
const formatDateCN = (): string => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
}

// Status config (reused in table & edit modal)
const statusConfig: Record<HotelStatus, { color: string; text: string }> = {
  [HotelStatus.PUBLISHED]: { color: 'success', text: '已通过' },
  [HotelStatus.REJECTED]: { color: 'error', text: '已驳回' },
  [HotelStatus.PENDING]: { color: 'processing', text: '待审核' },
}

const HotelList: React.FC = () => {
  const [hotels, setHotels] = useState<IHotel[]>(initialHotels)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<IHotel | null>(null) // null = Add mode
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [editedHotelIds, setEditedHotelIds] = useState<Set<string>>(new Set())
  const [form] = Form.useForm<HotelFormValues>()
  const { message, modal } = App.useApp()

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

  const handleSubmitReview = (hotel: IHotel) => {
    // Update status to PENDING and clear rejection reason
    setHotels((prev) =>
      prev.map((h) =>
        h.id === hotel.id ? { ...h, status: HotelStatus.PENDING, rejectionReason: undefined } : h,
      ),
    )
    // Remove from edited set after submitting review
    setEditedHotelIds((prev) => {
      const next = new Set(prev)
      next.delete(hotel.id)
      return next
    })
    message.success(`已提交"${hotel.name}"的审核申请`)
    // TODO: Call API to submit review
  }

  // --- Modal handlers (Add + Edit) ---
  const handleOpenAddModal = () => {
    setEditingHotel(null)
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
      description: undefined, // description field is for extra notes, not the type·star string
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingHotel(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 600))

      if (isEditMode) {
        // --- Edit mode ---
        setHotels((prev) =>
          prev.map((h) =>
            h.id === editingHotel.id
              ? {
                  ...h,
                  name: values.name,
                  description: `${values.type} · ${values.starRating}`,
                  address: values.address,
                }
              : h,
          ),
        )
        // Mark hotel as edited so "提交审核" button becomes enabled
        setEditedHotelIds((prev) => new Set(prev).add(editingHotel.id))
        message.success(`酒店"${values.name}"的信息已更新`)
      } else {
        // --- Add mode ---
        const newHotel: IHotel = {
          id: generateHotelId(),
          name: values.name,
          description: `${values.type} · ${values.starRating}`,
          address: values.address,
          submissionDate: formatDateCN(),
          status: HotelStatus.PENDING,
        }
        setHotels((prev) => [newHotel, ...prev])
        setPagination((prev) => ({ ...prev, total: (prev.total || 0) + 1 }))
        message.success(`酒店"${values.name}"已成功添加，等待审核`)
      }

      handleCloseModal()
    } catch {
      // Form validation failed — do nothing, AntD will show inline errors
    } finally {
      setConfirmLoading(false)
    }
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
        const isEdited = editedHotelIds.has(record.id)
        const canSubmit = isRejected || isEdited

        return (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleOpenEditModal(record)}
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
            columns={columns}
            dataSource={hotels}
            rowKey="id"
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
              <span className={styles.editInfoValue}>{editingHotel.id}</span>
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
    </div>
  )
}

export default HotelList
