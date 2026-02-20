import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Card,
  Statistic,
  Select,
  Switch,
  Progress,
  Modal,
  message,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  TagOutlined,
  PercentageOutlined,
  HeartOutlined,
  StarOutlined,
  SketchOutlined,
  ArrowUpOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import styles from './CouponManager.module.scss'
import CreateCouponModal from './CreateCouponModal'

// ===== 类型定义 =====

/** 折扣类型 */
type DiscountType = 'AMOUNT_OFF' | 'PERCENT_OFF'

/** 颜色主题 */
type ColorTheme = 'red' | 'orange' | 'blue' | 'purple' | 'green'

/** 优惠券数据接口 */
interface ICoupon {
  /** 优惠券 ID */
  id: string
  /** 优惠券名称 */
  name: string
  /** 折扣类型 */
  discountType: DiscountType
  /** 折扣描述 */
  discountLabel: string
  /** 开始日期 */
  startDate: string
  /** 结束日期 (空代表长期有效) */
  endDate: string
  /** 总量 (-1 代表无限制) */
  total: number
  /** 已使用 */
  used: number
  /** 是否在线 */
  active: boolean
  /** 颜色主题 */
  color: ColorTheme
}

// ===== 图标映射 =====
const couponIcons: Record<ColorTheme, React.ReactNode> = {
  red: <TagOutlined />,
  orange: <PercentageOutlined />,
  blue: <HeartOutlined />,
  purple: <StarOutlined />,
  green: <SketchOutlined />,
}

// ===== Mock 数据 =====
const mockCoupons: ICoupon[] = [
  {
    id: 'CP-20231001',
    name: '新用户注册专享',
    discountType: 'AMOUNT_OFF',
    discountLabel: '满300减50',
    startDate: '2023-10-01',
    endDate: '2023-12-31',
    total: 5000,
    used: 1245,
    active: true,
    color: 'red',
  },
  {
    id: 'CP-20231005',
    name: '国庆黄金周特惠',
    discountType: 'PERCENT_OFF',
    discountLabel: '8.5折优惠',
    startDate: '2023-10-01',
    endDate: '2023-10-07',
    total: 1000,
    used: 980,
    active: false,
    color: 'orange',
  },
  {
    id: 'CP-20231115',
    name: '冬季暖心大促',
    discountType: 'AMOUNT_OFF',
    discountLabel: '立减100元',
    startDate: '2023-11-15',
    endDate: '2024-01-15',
    total: 2000,
    used: 450,
    active: true,
    color: 'blue',
  },
  {
    id: 'CP-20230901',
    name: 'VIP会员升级礼',
    discountType: 'PERCENT_OFF',
    discountLabel: '9折优惠',
    startDate: '2023-09-01',
    endDate: '',
    total: -1,
    used: 3200,
    active: true,
    color: 'purple',
  },
  {
    id: 'CP-20230801',
    name: '环保出行补贴',
    discountType: 'AMOUNT_OFF',
    discountLabel: '立减20元',
    startDate: '2023-08-01',
    endDate: '2024-08-01',
    total: 2000,
    used: 890,
    active: true,
    color: 'green',
  },
]

// ===== 组件 =====
const CouponManager: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ICoupon[]>([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: 12,
    showTotal: (total, range) => `显示 ${range[0]} 到 ${range[1]} 条，共 ${total} 条结果`,
  })

  // 模拟异步加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockCoupons)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // 分页
  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination(pag)
  }

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    if (!value.trim()) {
      setData(mockCoupons)
      return
    }
    const filtered = mockCoupons.filter((item) => item.name.includes(value))
    setData(filtered)
  }

  // 状态筛选
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    if (value === 'all') {
      setData(mockCoupons)
      return
    }
    const isActive = value === 'online'
    setData(mockCoupons.filter((item) => item.active === isActive))
  }

  // 开关切换
  const handleToggle = (checked: boolean, record: ICoupon) => {
    const updated = data.map((item) =>
      item.id === record.id ? { ...item, active: checked } : item,
    )
    setData(updated)
    message.success(checked ? `「${record.name}」已上线` : `「${record.name}」已下线`)
  }

  // 创建新优惠券
  const handleCreate = () => {
    setCreateModalOpen(true)
  }

  // 创建提交
  const handleCreateSubmit = (coupon: ICoupon) => {
    setData((prev) => [coupon, ...prev])
    setCreateModalOpen(false)
    message.success(`优惠券「${coupon.name}」创建成功`)
  }

  // 编辑 (预留)
  const handleEdit = (record: ICoupon) => {
    message.info(`编辑「${record.name}」功能（待实现）`)
  }

  // 删除 (预留)
  const handleDelete = (record: ICoupon) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除优惠券「${record.name}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setData((prev) => prev.filter((item) => item.id !== record.id))
        message.success(`已删除「${record.name}」`)
      },
    })
  }

  // 筛选按钮 (预留)
  const handleFilter = () => {
    message.info('高级筛选功能（待实现）')
  }

  // ===== 计算用量 =====
  const getUsageInfo = (record: ICoupon) => {
    const totalText = record.total === -1 ? '无限制' : record.total.toLocaleString()
    const usedText = record.used.toLocaleString()
    const percent = record.total === -1 ? 60 : Math.round((record.used / record.total) * 100)
    const percentText = record.total === -1 ? '-' : `${percent}%`
    return { totalText, usedText, percent, percentText }
  }

  // 进度条颜色
  const getProgressColor = (record: ICoupon) => {
    if (record.total === -1) return record.color === 'purple' ? '#8b5cf6' : '#1890ff'
    const ratio = record.used / record.total
    if (ratio >= 0.9) return '#f97316'
    if (record.color === 'green') return '#22c55e'
    if (record.color === 'purple') return '#8b5cf6'
    return '#1890ff'
  }

  // ===== 列定义 =====
  const columns: ColumnsType<ICoupon> = [
    {
      title: '优惠券名称',
      key: 'name',
      render: (_: unknown, record: ICoupon) => (
        <div className={styles.couponNameCell}>
          <div className={`${styles.couponIcon} ${styles[record.color]}`}>
            {couponIcons[record.color]}
          </div>
          <div className={styles.couponNameText}>
            <span className={styles.name}>{record.name}</span>
            <span className={styles.id}>ID: {record.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: '折扣类型',
      key: 'discountType',
      width: 140,
      render: (_: unknown, record: ICoupon) => (
        <span className={`${styles.discountTag} ${styles[record.color]}`}>
          {record.discountLabel}
        </span>
      ),
    },
    {
      title: '有效期',
      key: 'validity',
      width: 160,
      render: (_: unknown, record: ICoupon) => (
        <div className={styles.dateCell}>
          <span className={styles.startDate}>{record.startDate}</span>
          <span className={styles.endDate}>
            {record.endDate ? `至 ${record.endDate}` : '长期有效'}
          </span>
        </div>
      ),
    },
    {
      title: '总量 / 已使用',
      key: 'usage',
      width: 180,
      render: (_: unknown, record: ICoupon) => {
        const { totalText, usedText, percent, percentText } = getUsageInfo(record)
        return (
          <div className={styles.usageCell}>
            <div className={styles.usageHeader}>
              <span className={styles.usageText}>
                {usedText} / {totalText}
              </span>
              <span className={styles.usagePercent}>{percentText}</span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              size="small"
              strokeColor={getProgressColor(record)}
              className={styles.progressBar}
            />
          </div>
        )
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      align: 'center',
      render: (_: unknown, record: ICoupon) => (
        <Switch
          checked={record.active}
          size="small"
          onChange={(checked) => handleToggle(checked, record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'right',
      render: (_: unknown, record: ICoupon) => (
        <div>
          <a className={styles.actionLink} onClick={() => handleEdit(record)}>
            编辑
          </a>
          <a className={styles.deleteLink} onClick={() => handleDelete(record)}>
            删除
          </a>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* ===== 页面标题 ===== */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <h2>平台优惠券</h2>
            <p>管理平台级营销优惠券，配置发放规则与使用条件。</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={styles.createBtn}
            onClick={handleCreate}
          >
            创建新优惠券
          </Button>
        </div>

        {/* ===== 统计卡片 ===== */}
        <div className={styles.statGrid}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>进行中优惠券</p>
              <Statistic value={12} valueStyle={{ fontSize: 30, fontWeight: 700 }} />
              <div className={styles.trendUp}>
                <ArrowUpOutlined style={{ fontSize: 12 }} />
                较上周 +2
              </div>
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <TagOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>今日领取数</p>
              <Statistic value={1286} valueStyle={{ fontSize: 30, fontWeight: 700 }} />
              <div className={styles.trendUp}>
                <ArrowUpOutlined style={{ fontSize: 12 }} />
                环比 +15%
              </div>
            </div>
            <div className={`${styles.statIcon} ${styles.indigo}`}>
              <DownloadOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>累计核销率</p>
              <Statistic value="68.4%" valueStyle={{ fontSize: 30, fontWeight: 700 }} />
              <div className={styles.trendNeutral}>总发放: 45,200</div>
            </div>
            <div className={`${styles.statIcon} ${styles.emerald}`}>
              <PercentageOutlined />
            </div>
          </Card>
        </div>

        {/* ===== 筛选栏 ===== */}
        <div className={styles.filterBar}>
          <div className={styles.searchInput}>
            <Input
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              placeholder="搜索优惠券名称..."
              allowClear
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <Select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={handleStatusChange}
              options={[
                { value: 'all', label: '所有状态' },
                { value: 'online', label: '在线' },
                { value: 'offline', label: '已下线' },
              ]}
            />
            <Button icon={<FilterOutlined />} className={styles.filterBtn} onClick={handleFilter}>
              筛选
            </Button>
          </div>
        </div>

        {/* ===== 表格 ===== */}
        <div className={styles.tableCard}>
          <Table<ICoupon>
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
          />
        </div>

        {/* ===== 创建优惠券弹窗 ===== */}
        <CreateCouponModal
          open={createModalOpen}
          onCancel={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      </div>
    </div>
  )
}

export default CouponManager
