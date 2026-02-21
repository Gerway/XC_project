import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Card, Statistic, App } from 'antd'
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
import AuditDrawer from './AuditDrawer'
import type { IAuditDetail } from './AuditDrawer'
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

/** 将表格行转为抽屉详情 Mock */
const toAuditDetail = (record: IAuditRecord): IAuditDetail => ({
  id: record.id,
  applicationNo: `2023102700${record.id.replace('AUDIT-', '')}89`,
  hotelName: record.name,
  merchantName: record.merchantName,
  merchantId: '882910',
  phone: '010-88886666',
  address: record.address || record.location,
  applyTime: `${record.submissionDate} ${record.submissionTime}:45`,
  description: `${record.name}位于繁华的CBD核心区，距离地铁1号线仅200米。酒店拥有现代化客房120间，配备全套智能家居系统。`,
  status: HotelStatus.PENDING,
  businessLicenseUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAPTSjBOY12EHAnT-_1Bygi0OkFNgfE2p1nVruso6Y3eGTmXQKklHLOmfKrUYV_mfN6Y6QNrhjv0AJERhIb8Di3a19V7IOTTNHd__PbwsoowRHhYPhG-gL6TgX0AZwId0Wia8OLHryWWZjG8EAVOIvPDTx5fjIpau4pyCM4tSqF-9zxwE_D_OBBe0Pike7aVOmeh2utFsCtvbXwdS14eUFLVzbKERa_Tbj9ed00vW6YGTWYpi8jEkExFHicj_p28W8alHO12G8tuYUu',
  permitUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBDl2zw0PI2eljJApagk72XyrHxGhXTHg5tz-h22r-MZLKx6WM9tQXk5ZhZZHKc6qXr8SbxE06_H2vOe6a_CxQJqPwULVHJybF_n4Y_KeR6R8pomM13QqB6zcx9TLsmqpEmhpCWX7FA2vT68Gys-KaEWGX3WizJ5q8sKHPyu2ZPANvQrz2Bpqbyg1kHgHhO8GE0AZ25Vd60mIKx8iaQocCG5Msxh62Lxwh7dK6IXDtcuzoYDoJlmIRyUg1U7VWY-vwDrM9hf6HoMiRB',
  scenePhotos: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBmKaX_ExvwB8Nng6GU2RARN2qWcAyWTFj2T0glmZ0i8x_a4G546qI9wc48aZHnq83A99uqlC4gjA1eQa-DG_x2QYA62wHYa_ZcHkFLYYvZwZf_dxBNr2Oh9SZoEoxX4oaXVk3rGilAbLLq1xPfmRgIZPUST_eKADKhWKp4psc2Z_UVp9qdI0lMAoPDA9e-RE4pGZvKNWXFG6XF6aUJ1iqfPLWAOTSwjPhJcH6hkrNWthMa8uUtiSvuQcK9YN0kYjCiLrrbOlnPhDuo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBwa11Ge_mIeB--MUr_hplUdp1nxociaZsPhCLC9Gdr3W6-r7eYq6LuSohQoS8htOk2h4RU1AvRUWAb7lShSUOgU5zgQ9Ra4WvcpnD_FQ0SHzDlVZMNsAARJiC86w5h2KxQDOD0k9rQd2XU7Om5igzQLpbBTlVIW0L8Ii-upwYk4qNlkaLopDYlrJolK8WnajsF_q1uI8DHKZmJTDFTpbnUJpRbVb8MQOxm9nG5ssMxpmehrptryZF5WZSA6VE4U77ZrdIJUAIT3ywk',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAVzTnR6rx6_9W4aa2IbAZo-7tg8wzC-FctDmZyRhUdXTArjURdxv3y6J6lq0T-hiH95x3irKNyOVuFcOwrstz4x1KgTEva-D0VTt-5JDQ5N4wnxd8c36-FDAv-Yaeg5q5hS17u2--uhwscOveI73VGouIwrIOYGVhRECaL9Me0Io6k1LdaeEvsEUs0Q6jA6qZIoQjnLLHZsGJR2tqI_OWNtKlRpYJdX3LuTGWy0X_rGKXZLvAAjRHTIDkWTjKyFRd3C72o_ElriKby',
  ],
  facilities: ['免费WiFi', '免费停车', '健身房', '自助早餐', '会议室'],
})

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

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<IAuditDetail | null>(null)
  const { message } = App.useApp()

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

  // 审核按钮 — 打开 Drawer
  const handleAudit = (record: IAuditRecord) => {
    setCurrentDetail(toAuditDetail(record))
    setDrawerOpen(true)
  }

  // 通过回调
  const handleApprove = (hotelId: string, remark: string) => {
    console.log('Approve:', hotelId, remark)
    message.success('审核通过！')
    setDrawerOpen(false)
  }

  // 驳回回调
  const handleReject = (hotelId: string, remark: string) => {
    console.log('Reject:', hotelId, remark)
    message.error('已驳回该申请')
    setDrawerOpen(false)
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
              placeholder="搜索酒店名称/ID"
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              variant="borderless"
              style={{ width: 240 }}
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
          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>待审核总数</p>
              <Statistic value={24} styles={{ content: { fontSize: 28, fontWeight: 700 } }} />
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <FieldTimeOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>今日新增</p>
              <Statistic value={8} styles={{ content: { fontSize: 28, fontWeight: 700 } }} />
            </div>
            <div className={`${styles.statIcon} ${styles.green}`}>
              <ArrowUpOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>平均处理时长</p>
              <Statistic value="2.5 小时" styles={{ content: { fontSize: 28, fontWeight: 700 } }} />
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
