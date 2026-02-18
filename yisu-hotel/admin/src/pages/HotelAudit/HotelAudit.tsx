import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Card, Statistic, Modal, message } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  SearchOutlined,
  FilterOutlined,
  FieldTimeOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import { HotelStatus } from '@yisu/shared'
import type { IHotel } from '@yisu/shared'
import styles from './HotelAudit.module.scss'

// ===== 审核队列数据类型 =====
interface IAuditRecord extends IHotel {
  /** 提交时间 (HH:mm) */
  submissionTime: string
  /** 商家名称 */
  merchantName: string
  /** 酒店位置 */
  location: string
}

// ===== Mock 数据 =====
const mockAuditData: IAuditRecord[] = [
  {
    id: 'AUDIT-001',
    name: '北京朝阳易宿酒店',
    submissionDate: '2023-10-27',
    submissionTime: '10:30',
    merchantName: '易宿集团',
    location: '北京市朝阳区建国路88号',
    status: HotelStatus.PENDING,
    address: '北京市朝阳区建国路88号',
  },
  {
    id: 'AUDIT-002',
    name: '上海浦东星光酒店',
    submissionDate: '2023-10-27',
    submissionTime: '09:15',
    merchantName: '星光酒店管理',
    location: '上海市浦东新区陆家嘴环路1000号',
    status: HotelStatus.PENDING,
    address: '上海市浦东新区陆家嘴环路1000号',
  },
  {
    id: 'AUDIT-003',
    name: '广州天河云端公寓',
    submissionDate: '2023-10-26',
    submissionTime: '18:45',
    merchantName: '云端旅宿',
    location: '广州市天河区天河路385号',
    status: HotelStatus.PENDING,
    address: '广州市天河区天河路385号',
  },
  {
    id: 'AUDIT-004',
    name: '深圳南山悦享酒店',
    submissionDate: '2023-10-26',
    submissionTime: '14:20',
    merchantName: '悦享生活',
    location: '深圳市南山区科技园南路68号',
    status: HotelStatus.PENDING,
    address: '深圳市南山区科技园南路68号',
  },
  {
    id: 'AUDIT-005',
    name: '杭州西湖山水客栈',
    submissionDate: '2023-10-26',
    submissionTime: '11:00',
    merchantName: '山水人家',
    location: '杭州市西湖区曙光路120号',
    status: HotelStatus.PENDING,
    address: '杭州市西湖区曙光路120号',
  },
]

// ===== 组件 =====
const HotelAudit: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<IAuditRecord[]>([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: 24,
    showTotal: (total, range) => `显示 ${range[0]} 到 ${range[1]} 条，共 ${total} 条结果`,
  })

  // 模拟异步加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockAuditData)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // 分页变化
  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination(pag)
  }

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    if (!value.trim()) {
      setData(mockAuditData)
      return
    }
    const filtered = mockAuditData.filter(
      (item) => item.name.includes(value) || item.merchantName.includes(value),
    )
    setData(filtered)
  }

  // 筛选按钮（预留）
  const handleFilter = () => {
    message.info('筛选功能（待实现）')
  }

  // 审核按钮 — 打开 Modal
  const handleAudit = (record: IAuditRecord) => {
    Modal.confirm({
      title: '酒店审核',
      content: (
        <div>
          <p>
            您正在审核 <strong>{record.name}</strong>（商家：{record.merchantName}）
          </p>
          <p>确认通过此酒店的入驻申请？</p>
        </div>
      ),
      okText: '通过',
      cancelText: '取消',
      onOk: () => {
        message.success(`已通过「${record.name}」的入驻审核`)
      },
    })
  }

  // ===== 表格列配置 =====
  const columns: ColumnsType<IAuditRecord> = [
    {
      title: '提交时间',
      key: 'submitTime',
      width: 160,
      render: (_: unknown, record: IAuditRecord) => (
        <div className={styles.timeCell}>
          <span className={styles.date}>{record.submissionDate}</span>
          <span className={styles.time}>{record.submissionTime}</span>
        </div>
      ),
    },
    {
      title: '商家名称',
      dataIndex: 'merchantName',
      key: 'merchantName',
      width: 180,
      render: (name: string) => (
        <div className={styles.merchantCell}>
          <div className={styles.merchantIcon}>
            <ShopOutlined />
          </div>
          <span className={styles.merchantName}>{name}</span>
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
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (loc: string) => (
        <div className={styles.locationCell}>
          <EnvironmentOutlined className={styles.locationIcon} />
          <span className={styles.locationText} title={loc}>
            {loc}
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
          <div className={styles.pageActions}>
            <Input
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              placeholder="搜索酒店或商家..."
              className={styles.searchInput}
              allowClear
              onChange={(e) => handleSearch(e.target.value)}
              value={searchText}
            />
            <Button icon={<FilterOutlined />} className={styles.filterBtn} onClick={handleFilter}>
              筛选
            </Button>
          </div>
        </div>

        {/* ===== 统计卡片 ===== */}
        <div className={styles.statGrid}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>待审核总数</p>
              <Statistic value={24} valueStyle={{ fontSize: 28, fontWeight: 700 }} />
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <FieldTimeOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>今日新增</p>
              <Statistic value={8} valueStyle={{ fontSize: 28, fontWeight: 700 }} />
            </div>
            <div className={`${styles.statIcon} ${styles.green}`}>
              <ArrowUpOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>平均处理时长</p>
              <Statistic value="2.5 小时" valueStyle={{ fontSize: 28, fontWeight: 700 }} />
            </div>
            <div className={`${styles.statIcon} ${styles.orange}`}>
              <ClockCircleOutlined />
            </div>
          </Card>
        </div>

        {/* ===== 审核表格 ===== */}
        <div className={styles.tableCard}>
          <Table<IAuditRecord>
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </div>

        <div className={styles.footer}>© 2026 易宿酒店管理平台。保留所有权利。</div>
      </div>
    </div>
  )
}

export default HotelAudit
