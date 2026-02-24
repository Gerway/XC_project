import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Input,
  Card,
  Statistic,
  Select,
  Form,
  App,
  Modal,
  Popconfirm,
  InputNumber,
  Row,
  Col,
  Tag,
  Image,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  SearchOutlined,
  FilterOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  StarFilled,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { adminHotelApi, type IAdminHotel, type UpdateHotelBody } from '../../api/hotel'
import styles from './AdminHotelManager.module.scss'

// ─── 状态映射 ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, { text: string; class: string }> = {
  0: { text: '待审核', class: 'pending' },
  1: { text: '已发布', class: 'published' },
  2: { text: '已驳回', class: 'rejected' },
}

const HOTEL_TYPE_MAP: Record<number, string> = {
  0: '未分类',
  1: '经济酒店',
  2: '商务酒店',
  3: '度假酒店',
  4: '精品酒店',
  5: '公寓酒店',
  6: '民宿客栈',
}

const STAR_OPTIONS = [
  { label: '全部星级', value: '' },
  { label: '一星', value: 1 },
  { label: '二星', value: 2 },
  { label: '三星', value: 3 },
  { label: '四星', value: 4 },
  { label: '五星', value: 5 },
]

const STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '待审核', value: 0 },
  { label: '已发布', value: 1 },
  { label: '已驳回', value: 2 },
]

// ─── 组件 ──────────────────────────────────────────────────────────────────────

const AdminHotelManager: React.FC = () => {
  const { message } = App.useApp()
  const [editForm] = Form.useForm()

  // Data
  const [loading, setLoading] = useState(true)
  const [hotels, setHotels] = useState<IAdminHotel[]>([])
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0 })
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total, range) =>
      `显示 ${range[0]} 到 ${range[1]} 条，共 ${total.toLocaleString()} 条`,
  })

  // Filters
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | ''>('')
  const [starFilter, setStarFilter] = useState<number | ''>('')

  // Edit modal
  const [editVisible, setEditVisible] = useState(false)
  const [editTarget, setEditTarget] = useState<IAdminHotel | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // ── Fetch hotels ─────────────────────────────────────────────────────────
  const fetchHotels = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true)
      try {
        const params: Parameters<typeof adminHotelApi.getList>[0] = { page, pageSize }
        if (keyword) params.keyword = keyword
        if (statusFilter !== '') params.status = statusFilter
        if (starFilter !== '') params.star_rating = starFilter

        const raw = await adminHotelApi.getList(params)
        const res = raw as unknown as Record<string, unknown>
        const innerData = (res?.data ?? res) as Record<string, unknown>
        const list = (innerData?.list ?? []) as IAdminHotel[]
        const total = (innerData?.total ?? 0) as number
        const statsData = (innerData?.stats ?? { total: 0, published: 0, pending: 0 }) as {
          total: number
          published: number
          pending: number
        }

        setHotels(list)
        setStats(statsData)
        setPagination((p) => ({ ...p, current: page, pageSize, total }))
      } catch (err) {
        console.error('fetchHotels error:', err)
        message.error('网络错误，获取酒店列表失败')
      } finally {
        setLoading(false)
      }
    },
    [keyword, statusFilter, starFilter, message],
  )

  useEffect(() => {
    fetchHotels(1, 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilter = () => fetchHotels(1, pagination.pageSize as number)
  const handleReset = () => {
    setKeyword('')
    setStatusFilter('')
    setStarFilter('')
    fetchHotels(1, pagination.pageSize as number)
  }
  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchHotels(pag.current ?? 1, pag.pageSize ?? 10)
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleOpenEdit = (record: IAdminHotel) => {
    setEditTarget(record)
    editForm.setFieldsValue({
      name: record.name,
      address: record.address,
      city_name: record.city_name,
      star_rating: record.star_rating,
      hotel_type: record.hotel_type,
      tags: Array.isArray(record.tags) ? record.tags.join(', ') : record.tags,
      description: record.description,
      remark: record.remark,
      latitude: record.latitude,
      longitude: record.longitude,
    })
    setEditVisible(true)
  }

  const handleEditSubmit = async () => {
    if (!editTarget) return
    try {
      const values = await editForm.validateFields()
      const payload: UpdateHotelBody = {
        hotel_id: editTarget.hotel_id,
        name: values.name,
        address: values.address,
        city_name: values.city_name,
        star_rating: values.star_rating,
        hotel_type: values.hotel_type,
        tags: values.tags
          ? String(values.tags)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
        description: values.description,
        remark: values.remark,
        latitude: values.latitude,
        longitude: values.longitude,
      }
      setEditLoading(true)
      const res = await adminHotelApi.updateHotel(payload)
      if (res?.code === 200) {
        message.success('酒店信息已更新')
        setEditVisible(false)
        fetchHotels(pagination.current as number, pagination.pageSize as number)
      } else {
        message.error(res?.message || '更新失败')
      }
    } catch {
      // validation error or network error
    } finally {
      setEditLoading(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (record: IAdminHotel) => {
    try {
      const res = await adminHotelApi.deleteHotel({ hotel_id: record.hotel_id })
      if (res?.code === 200) {
        message.success(`已删除酒店「${record.name}」`)
        fetchHotels(pagination.current as number, pagination.pageSize as number)
      } else {
        message.error(res?.message || '删除失败')
      }
    } catch {
      message.error('网络错误，删除失败')
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ColumnsType<IAdminHotel> = [
    {
      title: '酒店',
      key: 'hotel',
      width: 260,
      render: (_: unknown, record: IAdminHotel) => (
        <div className={styles.hotelCell}>
          {record.cover_url ? (
            <Image
              src={record.cover_url}
              width={48}
              height={36}
              className={styles.hotelCover}
              preview={false}
              fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjVmNWY1Ii8+PC9zdmc+"
            />
          ) : (
            <div
              className={styles.hotelCover}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <HomeOutlined style={{ fontSize: 16, color: '#d1d5db' }} />
            </div>
          )}
          <div className={styles.hotelMeta}>
            <span className={styles.hotelName}>{record.name}</span>
            <span className={styles.merchantName}>
              {record.merchant_name || '未知商家'} · {record.city_name || '-'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '星级',
      key: 'star',
      width: 70,
      align: 'center',
      render: (_: unknown, record: IAdminHotel) => (
        <span className={styles.starBadge}>
          <StarFilled style={{ fontSize: 10 }} />
          {record.star_rating || '-'}
        </span>
      ),
    },
    {
      title: '类型',
      key: 'type',
      width: 90,
      render: (_: unknown, record: IAdminHotel) => (
        <Tag>{HOTEL_TYPE_MAP[record.hotel_type] || '未分类'}</Tag>
      ),
    },
    {
      title: '评分',
      key: 'score',
      width: 80,
      render: (_: unknown, record: IAdminHotel) => (
        <div className={styles.scoreCell}>
          <span className={styles.scoreValue}>
            {record.score != null ? Number(record.score).toFixed(1) : '-'}
          </span>
          <span className={styles.reviewCount}>{record.reviews || 0} 条</span>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      align: 'center',
      render: (_: unknown, record: IAdminHotel) => {
        const cfg = STATUS_MAP[record.status] || { text: '未知', class: 'pending' }
        return (
          <span className={`${styles.statusBadge} ${styles[cfg.class]}`}>
            <span className={`${styles.statusDot} ${styles[cfg.class]}`} />
            {cfg.text}
          </span>
        )
      },
    },
    {
      title: '创建时间',
      key: 'created_at',
      width: 100,
      render: (_: unknown, record: IAdminHotel) => (
        <span className={styles.dateText}>
          {record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD') : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'right',
      render: (_: unknown, record: IAdminHotel) => (
        <div className={styles.actionCell}>
          <a className={styles.editLink} onClick={() => handleOpenEdit(record)}>
            <EditOutlined /> 编辑
          </a>
          <Popconfirm
            title="确认删除此酒店？"
            description="删除后将同时清除该酒店的所有房型、库存和媒体数据。"
            onConfirm={() => handleDelete(record)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <a className={styles.deleteLink}>
              <DeleteOutlined /> 删除
            </a>
          </Popconfirm>
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h2>酒店管理中心</h2>
          <p>查看、编辑和管理平台上的所有酒店信息。</p>
        </div>

        {/* Stat Cards */}
        <div className={styles.statGrid}>
          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>酒店总数</p>
              <Statistic
                value={stats.total}
                styles={{ content: { fontSize: 24, fontWeight: 700 } }}
              />
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <HomeOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>已发布</p>
              <Statistic
                value={stats.published}
                styles={{ content: { fontSize: 24, fontWeight: 700 } }}
              />
            </div>
            <div className={`${styles.statIcon} ${styles.green}`}>
              <CheckCircleOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>待审核</p>
              <Statistic
                value={stats.pending}
                styles={{ content: { fontSize: 24, fontWeight: 700 } }}
              />
            </div>
            <div className={`${styles.statIcon} ${styles.orange}`}>
              <ClockCircleOutlined />
            </div>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterCard}>
          <Form layout="vertical" className={styles.filterForm}>
            <Form.Item label="搜索酒店" className={styles.searchField}>
              <Input
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                placeholder="输入酒店名称、地址或ID"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
                onPressEnter={handleFilter}
              />
            </Form.Item>

            <Form.Item label="状态" className={styles.selectField}>
              <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            </Form.Item>

            <Form.Item label="星级" className={styles.selectField}>
              <Select value={starFilter} onChange={setStarFilter} options={STAR_OPTIONS} />
            </Form.Item>

            <Form.Item>
              <div className={styles.filterActions}>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  className={styles.filterBtn}
                  onClick={handleFilter}
                >
                  筛选
                </Button>
                <Button className={styles.resetBtn} onClick={handleReset}>
                  重置
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          <Table<IAdminHotel>
            columns={columns}
            dataSource={hotels}
            rowKey="hotel_id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title={
          <span>
            <EditOutlined /> 编辑酒店 — {editTarget?.name}
          </span>
        }
        open={editVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditVisible(false)}
        okText="保存修改"
        cancelText="取消"
        confirmLoading={editLoading}
        destroyOnClose
        width={680}
        className={styles.editModal}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="酒店名称"
                name="name"
                rules={[{ required: true, message: '请输入酒店名称' }]}
              >
                <Input placeholder="酒店名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="城市" name="city_name">
                <Input placeholder="如：重庆" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="详细地址"
            name="address"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="详细地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="星级" name="star_rating">
                <Select options={STAR_OPTIONS.slice(1)} placeholder="选择星级" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="酒店类型" name="hotel_type">
                <Select
                  options={Object.entries(HOTEL_TYPE_MAP).map(([k, v]) => ({
                    label: v,
                    value: Number(k),
                  }))}
                  placeholder="选择类型"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="标签 (逗号分隔)" name="tags">
                <Input placeholder="豪华, 江景, 亲子" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="经度" name="longitude">
                <InputNumber style={{ width: '100%' }} placeholder="如: 106.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="纬度" name="latitude">
                <InputNumber style={{ width: '100%' }} placeholder="如: 29.5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="酒店描述" name="description">
            <Input.TextArea rows={3} placeholder="面向用户的描述" />
          </Form.Item>

          <Form.Item label="内部备注" name="remark">
            <Input.TextArea rows={2} placeholder="仅管理员可见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminHotelManager
