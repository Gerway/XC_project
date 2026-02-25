import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Button, Input, Card, Statistic, Progress, App } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  TagOutlined,
  PercentageOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import styles from './CouponManager.module.scss'
import CreateCouponModal from './CreateCouponModal'
import {
  getCouponsListApi,
  createCouponApi,
  deleteCouponApi,
  type ICoupon,
  type CouponCreateParams,
} from '../../api/coupon'

// ===== 组件 =====
const CouponManager: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ICoupon[]>([])
  const [searchText, setSearchText] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: 12,
    showTotal: (total, range) => `显示 ${range[0]} 到 ${range[1]} 条，共 ${total} 条结果`,
  })
  const { message, modal } = App.useApp()

  // 异步加载真实数据
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getCouponsListApi()
      setData(res as unknown as ICoupon[]) // 需要在 axios resolve 上设置正确类型
    } catch {
      message.error('获取优惠券列表失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  // 分页
  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination(pag)
  }

  // ===== 基于现有数据的前端统计计算 =====
  // 1. 进行中优惠券 (有效期涵盖当下的)
  const activeCouponsCount = data.filter((item) => {
    const now = new Date().getTime()
    // 如果没有 start_time 或 end_time，视同长期有效
    if (!item.start_time || !item.end_time) return true
    const start = new Date(item.start_time).getTime()
    const end = new Date(item.end_time).getTime()
    return now >= start && now <= end
  }).length

  // 2. 累计被领取总数 (累加所有优惠券的 issued_count)
  const totalIssuedCount = data.reduce((sum, item) => sum + (item.issued_count || 0), 0)

  // 3. 整体领取率 (总领取数 / 总发行数)
  // 将不限量(-1)的券剔除出分母计算，避免干扰百分比
  const limitedCoupons = data.filter((c) => c.total_count !== -1)
  const totalCapacity = limitedCoupons.reduce((sum, c) => sum + (c.total_count || 0), 0)
  const limitedIssued = limitedCoupons.reduce((sum, c) => sum + (c.issued_count || 0), 0)
  const claimRate =
    totalCapacity > 0 ? ((limitedIssued / totalCapacity) * 100).toFixed(1) + '%' : '0%'

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    if (!value.trim()) {
      fetchCoupons()
      return
    }
    const filtered = data.filter((item) => item.title && item.title.includes(value))
    setData(filtered)
  }

  // 创建新优惠券
  const handleCreate = () => {
    setCreateModalOpen(true)
  }

  // 创建提交
  const handleCreateSubmit = async (coupon: CouponCreateParams) => {
    try {
      await createCouponApi(coupon)
      message.success(`优惠券「${coupon.title}」创建成功`)
      setCreateModalOpen(false)
      fetchCoupons() // 重新获取列表
    } catch {
      message.error('创建优惠券失败')
    }
  }

  // 删除 (预留)
  const handleDelete = useCallback(
    (record: ICoupon) => {
      modal.confirm({
        title: '确认删除',
        content: `确定要删除优惠券「${record.title}」吗？此操作不可恢复。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            await deleteCouponApi(record.coupon_id)
            message.success(`已删除「${record.title}」`)
            fetchCoupons() // 重新获取列表
          } catch {
            message.error('删除优惠券失败')
          }
        },
      })
    },
    [modal, message, fetchCoupons],
  )

  // ===== 计算用量 =====
  const getUsageInfo = useCallback((record: ICoupon) => {
    const totalText = record.total_count === -1 ? '无限制' : record.total_count.toLocaleString()
    const usedText = record.issued_count.toLocaleString()
    const percent =
      record.total_count === -1 ? 60 : Math.round((record.issued_count / record.total_count) * 100)
    const percentText = record.total_count === -1 ? '-' : `${percent}%`
    return { totalText, usedText, percent, percentText }
  }, [])

  const getProgressColor = useCallback((record: ICoupon) => {
    if (record.total_count === -1) return '#1890ff'
    const ratio = record.issued_count / record.total_count
    if (ratio >= 0.9) return '#f97316'
    return '#1890ff'
  }, [])

  // ===== 列定义 =====
  const columns = useMemo<ColumnsType<ICoupon>>(
    () => [
      {
        title: '优惠券名称',
        key: 'title',
        render: (_: unknown, record: ICoupon) => (
          <div className={styles.couponNameCell}>
            <div className={`${styles.couponIcon} ${styles.blue}`}>
              <TagOutlined />
            </div>
            <div className={styles.couponNameText}>
              <span className={styles.name}>{record.title}</span>
              <span className={styles.id}>ID: {record.coupon_id}</span>
            </div>
          </div>
        ),
      },
      {
        title: '折扣规则',
        key: 'discountRule',
        width: 140,
        render: (_: unknown, record: ICoupon) => (
          <span className={`${styles.discountTag} ${styles.blue}`}>
            满{record.min_spend}减{record.discount_amount}
          </span>
        ),
      },
      {
        title: '有效期',
        key: 'validity',
        render: (_: unknown, record: ICoupon) => (
          <div className={styles.dateCell}>
            <span className={styles.startDate}>{record.start_time || '-'}</span>
            <span className={styles.endDate}>
              {record.end_time ? `至 ${record.end_time}` : '长期有效'}
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
        title: '操作',
        key: 'action',
        width: 130,
        align: 'right',
        render: (_: unknown, record: ICoupon) => (
          <div className={styles.actionCell}>
            <a className={styles.deleteLink} onClick={() => handleDelete(record)}>
              删除
            </a>
          </div>
        ),
      },
    ],
    [getUsageInfo, getProgressColor, handleDelete],
  )

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
          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>进行中优惠券</p>
              <Statistic
                value={activeCouponsCount}
                styles={{ content: { fontSize: 30, fontWeight: 700 } }}
              />
              <div className={styles.trendNeutral}>根据时效自动统计</div>
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <TagOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>累计被领取量</p>
              <Statistic
                value={totalIssuedCount}
                styles={{ content: { fontSize: 30, fontWeight: 700 } }}
              />
              <div className={styles.trendNeutral}>所有券的总发放数</div>
            </div>
            <div className={`${styles.statIcon} ${styles.indigo}`}>
              <DownloadOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>整体领取率</p>
              <Statistic
                value={claimRate}
                styles={{ content: { fontSize: 30, fontWeight: 700 } }}
              />
              <div className={styles.trendNeutral}>限量优惠券的领取占比</div>
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
        </div>

        {/* ===== 表格 ===== */}
        <div className={styles.tableCard}>
          <Table<ICoupon>
            columns={columns}
            dataSource={data}
            rowKey="coupon_id"
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
