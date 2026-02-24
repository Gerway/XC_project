import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Card, Statistic, App } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { FieldTimeOutlined, ShopOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { HotelStatus } from '@yisu/shared'
import type { IHotel } from '@yisu/shared'
import AuditDrawer from './AuditDrawer'
import type { IAuditDetail } from './AuditDrawer'
import { hotelApi } from '../../api/hotel'
import styles from './HotelAudit.module.scss'

// ===== 审核队列数据类型 =====
interface IAuditRecord extends IHotel {
  /** 商家名称 */
  merchant_name?: string
  /** 创建时间 */
  created_at?: string
}

/** 将表格行转为抽屉详情 */
const toAuditDetail = (record: IAuditRecord): IAuditDetail => ({
  id: String(record.hotel_id),
  applicationNo: String(record.hotel_id),
  hotelName: record.name,
  merchantName: record.merchant_name || '未知商家',
  merchantId: '-',
  phone: '-',
  address: record.address || '',
  applyTime: record.created_at || '',
  description: record.remark || record.description || '暂无描述',
  status: HotelStatus.PENDING,
  scenePhotos: (record.media || [])
    .filter((m: { media_type: number }) => m.media_type === 1)
    .map((m: { url: string }) => m.url),
  facilities: [],
})

// ===== 组件 =====
const HotelAudit: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<IAuditRecord[]>([])
  const [stats, setStats] = useState({ totalPending: 0 })
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: 0,
    showTotal: (total, range) => `显示 ${range[0]} 到 ${range[1]} 条，共 ${total} 条结果`,
  })

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<IAuditDetail | null>(null)
  const { message } = App.useApp()

  // 获取待审核列表
  const fetchAuditList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await hotelApi.getAuditList()
      if (res && res.data) {
        const list: IAuditRecord[] = Array.isArray(res.data) ? res.data : res.data.data || []

        // 如果返回的是 { data: [...], stats: {...} } 结构
        const rawStats = res.data.stats || {}
        setStats({
          totalPending: rawStats.totalPending || list.length,
        })

        setData(list)
        setPagination((prev) => ({ ...prev, total: list.length }))
      }
    } catch (err) {
      console.error(err)
      message.error('获取待审核列表失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchAuditList()
  }, [fetchAuditList])

  // 分页变化
  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination(pag)
  }

  // 审核按钮 — 打开 Drawer
  const handleAudit = (record: IAuditRecord) => {
    setCurrentDetail(toAuditDetail(record))
    setDrawerOpen(true)
  }

  // 通过回调
  const handleApprove = async (hotelId: string, remark: string) => {
    try {
      await hotelApi.auditHotel({ hotel_id: hotelId, action: 'approve', rejection_reason: remark })
      message.success('审核通过！')
      setDrawerOpen(false)
      fetchAuditList()
    } catch (err) {
      console.error(err)
      message.error('审核操作失败')
    }
  }

  // 驳回回调
  const handleReject = async (hotelId: string, remark: string) => {
    try {
      await hotelApi.auditHotel({ hotel_id: hotelId, action: 'reject', rejection_reason: remark })
      message.error('已驳回该申请')
      setDrawerOpen(false)
      fetchAuditList()
    } catch (err) {
      console.error(err)
      message.error('审核操作失败')
    }
  }

  // ===== 表格列配置 =====
  const columns: ColumnsType<IAuditRecord> = [
    {
      title: '提交时间',
      key: 'submitTime',
      width: 160,
      render: (_: unknown, record: IAuditRecord) => {
        const dt = record.created_at ? new Date(record.created_at) : null
        return (
          <div className={styles.timeCell}>
            <span className={styles.date}>{dt ? dt.toLocaleDateString('zh-CN') : '-'}</span>
            <span className={styles.time}>
              {dt ? dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        )
      },
    },
    {
      title: '商家名称',
      dataIndex: 'merchant_name',
      key: 'merchantName',
      width: 180,
      render: (name: string) => (
        <div className={styles.merchantCell}>
          <div className={styles.merchantIcon}>
            <ShopOutlined />
          </div>
          <span className={styles.merchantName}>{name || '未知商家'}</span>
        </div>
      ),
    },
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (name: string) => <span className={styles.hotelName}>{name}</span>,
    },
    {
      title: '位置',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (loc: string) => (
        <div className={styles.locationCell}>
          <EnvironmentOutlined className={styles.locationIcon} />
          <span className={styles.locationText} title={loc}>
            {loc || '-'}
          </span>
        </div>
      ),
    },
    {
      title: '当前状态',
      key: 'status',
      width: 120,
      render: () => <span className={styles.statusPending}>待审核</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'right',
      render: (_: unknown, record: IAuditRecord) => (
        <Button
          type="primary"
          size="small"
          className={styles.auditBtn}
          onClick={() => handleAudit(record)}
        >
          审核
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* ===== 页面标题 & 搜索 ===== */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <h2>待审核酒店审计</h2>
            <p>查看并处理商家提交的酒店入驻申请，请确保信息真实有效。</p>
          </div>
        </div>

        {/* ===== 统计卡片 ===== */}
        <div className={styles.statGrid}>
          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>待审核总数</p>
              <Statistic
                value={stats.totalPending}
                styles={{ content: { fontSize: 28, fontWeight: 700 } }}
              />
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <FieldTimeOutlined />
            </div>
          </Card>
        </div>

        {/* ===== 审核表格 ===== */}
        <div className={styles.tableCard}>
          <Table<IAuditRecord>
            columns={columns}
            dataSource={data}
            rowKey="hotel_id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </div>

        <div className={styles.footer}>© 2026 易宿酒店管理平台。保留所有权利。</div>
      </div>

      {/* ===== 审核抽屉 ===== */}
      <AuditDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        detail={currentDetail}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}

export default HotelAudit
