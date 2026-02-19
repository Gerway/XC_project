import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Card, Statistic, Select, Avatar, Popover, Form, message } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  UserAddOutlined,
  RiseOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { UserRole } from '@yisu/shared'
import styles from './UserManager.module.scss'

// ===== 用户状态 =====
type UserStatus = 'active' | 'banned'

// ===== 用户数据接口 =====
interface IUser {
  /** 用户 ID (展示用) */
  uid: string
  /** 用户名 / 商家名 */
  name: string
  /** 头像 URL */
  avatar: string
  /** 联系方式 (脱敏手机号 / 邮箱) */
  contact: string
  /** 角色 */
  role: UserRole
  /** 注册日期 */
  registerDate: string
  /** 上次登录 */
  lastLogin: string
  /** 状态 */
  status: UserStatus
}

// ===== 角色中文映射 =====
const roleLabel: Record<UserRole, string> = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.MERCHANT]: '商家',
  [UserRole.CUSTOMER]: '客户',
}

// ===== 角色 → 样式 class =====
const roleStyleMap: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'admin',
  [UserRole.MERCHANT]: 'merchant',
  [UserRole.CUSTOMER]: 'customer',
}

// ===== Mock 数据 =====
const mockUsers: IUser[] = [
  {
    uid: '#1001',
    name: '李明 (Li Ming)',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDZVr7yolEAUyGImCHwPzIbBLbJ1xTyJmilHTJ6fnEVO5E2gwyT2rULdwelLNsjiw_R0AYqskPV6Mxue9el2dD4QrfFcSKJlFh7H_-obQZ0IlE3T8rjizY5Anw_Tnl0DVA7jpw3eZdT1QN8D-LmGfeYu9bUTObqVIeZDYAD761bJmIVv35vcT6x8yP-3o9yfSJcjRyGFDAC_Ave8_1DtH_SBpFzxJChkJqqv1QMCdZawIh_pfSq3_tCCM3gdAXuqnxjO6vEYLTCq78',
    contact: '138****1234',
    role: UserRole.ADMIN,
    registerDate: '2023-01-15',
    lastLogin: '2023-10-24 09:30',
    status: 'active',
  },
  {
    uid: '#1002',
    name: '王氏酒店集团',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBm0GXH3c17ntrQcJPQACUUVmHVDY17wKF8plv5EdW2LZ6XgN41twLhV9co0wvlv-V8WxGmLyuf4p69LHYziTHjcVaQbcFWVOdFY-sc6xShwVgNcJACJj3jbFwvIo6Y5G_d5dLNOz1XDZjURDUQLD-Y5hlG6QfiFJQrv5Oz3ly2XiQvptD1VCo-vBy3r2LkErEUxm9b7PsN8gAeEX4y6rwiTyIuD3uonIMs08_Vr-1Fgb_B_F2qP-qoG3dRV0yg8hGacu-xIC1mO_nb',
    contact: 'wang@hotel.com',
    role: UserRole.MERCHANT,
    registerDate: '2023-03-22',
    lastLogin: '2023-10-23 14:15',
    status: 'active',
  },
  {
    uid: '#1003',
    name: 'Sarah Chen',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJyW48a31XlRJZXoA1D_K1SWyhBa6OB32ZcetCuyLJHcsC4uGDx4q4A5WsiWrdfc-xULFaYDkKTmZM9fSGUG2UfXs_MoRbUaod91dqDai61PKAzvLXd4pwL1AhkYNWWa5SvWFF2rgqVD1XhA1XzyzOnnhfqHVTnpC84tZ0aTLDNMsvDxqncBNnaD010QlVO1Gn3LfYlKNKgumPKjMX4frkrfzpJ353qQfoXSLpB_ax-NJypG79IKOwYMePe4xx91zUKvVF76WCWjYJ',
    contact: '139****5678',
    role: UserRole.CUSTOMER,
    registerDate: '2023-05-10',
    lastLogin: '2023-10-20 18:45',
    status: 'banned',
  },
  {
    uid: '#1004',
    name: 'Jack Ma',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdYSXwrtzl4J1Fr-Zt2ac3QIijZPSXZIm3Z_t1-_f7a0DcP_4W4M_V45ubuQ1goAUglxPkc2JAghqL0YGOyFGMyZJZKQPsIohIeHmSTVpJ0iFj7qfoS_dfXaS0TsqQMg63Z23mW9J1C9tW_mJcDilYf6D6piGsWOiRXWz8m4Hs0EkQHXOGbmkGiCJb_G1QOCWzm9I1ROTcvWfW6Vv-0a9M9VxTr-1A8DCugJGsczv1upusvL2dz1e7JiTyT4PO6Y-ezcaUucewuNB8',
    contact: '136****9999',
    role: UserRole.CUSTOMER,
    registerDate: '2023-06-15',
    lastLogin: '2023-10-24 11:20',
    status: 'active',
  },
  {
    uid: '#1005',
    name: '易宿官方自营',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbmCVakwqddeATIg1s9lS5hKeeiyx0RD0onwKMvvDXX_KTbo6MdzDeMq1Bh-G78t0fBMLkNjywwXZbfSBVhhW0r8tRkH-MTCx0MA-uRjMfRGCEFLkfK-5lEzOU-j7ag66uBNxzyxFzt0asoPYn9EKQTouO6qAVvVoM9Io0y2ioC0DCFfmkFHVzw89d5din5ApaDW-QAA31P3du_szNHnJfDAioFO0lWikSLaBo2XgsewY0LfDEkHOPhimni1mMYREXNW2QZ_U4q4BA',
    contact: 'official@yisu.com',
    role: UserRole.MERCHANT,
    registerDate: '2023-01-01',
    lastLogin: '2023-10-24 08:00',
    status: 'active',
  },
]

// ===== 封禁 Popover 内容 =====
const BanPopContent: React.FC<{
  userName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}> = ({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState('')

  return (
    <div className={styles.banPopContent}>
      <div className={styles.banPopHeader}>
        <ExclamationCircleOutlined className={styles.banPopIcon} />
        <div>
          <div className={styles.banPopTitle}>确认封禁该账户?</div>
          <div className={styles.banPopTextarea}>
            <Input.TextArea
              rows={2}
              placeholder="请输入封禁原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className={styles.banPopActions}>
        <Button size="small" className={styles.banPopCancel} onClick={onCancel}>
          取消
        </Button>
        <Button size="small" className={styles.banPopConfirm} onClick={() => onConfirm(reason)}>
          确定封禁
        </Button>
      </div>
    </div>
  )
}

// ===== 组件 =====
const UserManager: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<IUser[]>([])
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [banPopOpen, setBanPopOpen] = useState<string | null>(null)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: 12543,
    showTotal: (total, range) =>
      `显示 ${range[0]} 到 ${range[1]} 条，共 ${total.toLocaleString()} 条结果`,
  })

  // 模拟异步
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockUsers)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // 分页
  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination(pag)
  }

  // 筛选
  const handleFilter = () => {
    let result = [...mockUsers]
    if (searchText.trim()) {
      result = result.filter((u) => u.name.includes(searchText) || u.contact.includes(searchText))
    }
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (statusFilter !== 'all') {
      result = result.filter((u) => u.status === statusFilter)
    }
    setData(result)
  }

  // 重置
  const handleReset = () => {
    setSearchText('')
    setRoleFilter('all')
    setStatusFilter('all')
    setData(mockUsers)
  }

  // 查看详情 (预留)
  const handleDetail = (record: IUser) => {
    message.info(`查看「${record.name}」详情（待实现）`)
  }

  // 封禁
  const handleBan = (record: IUser, reason: string) => {
    setBanPopOpen(null)
    const updated = data.map((u) =>
      u.uid === record.uid ? { ...u, status: 'banned' as UserStatus } : u,
    )
    setData(updated)
    message.success(`已封禁用户「${record.name}」${reason ? `，原因：${reason}` : ''}`)
  }

  // 解封
  const handleUnban = (record: IUser) => {
    const updated = data.map((u) =>
      u.uid === record.uid ? { ...u, status: 'active' as UserStatus } : u,
    )
    setData(updated)
    message.success(`已解封用户「${record.name}」`)
  }

  // ===== 列定义 =====
  const columns: ColumnsType<IUser> = [
    {
      title: '用户ID',
      dataIndex: 'uid',
      key: 'uid',
      width: 100,
      render: (uid: string) => <span className={styles.userId}>{uid}</span>,
    },
    {
      title: '用户',
      key: 'user',
      render: (_: unknown, record: IUser) => (
        <div className={styles.userCell}>
          <Avatar src={record.avatar} size={36} className={styles.userAvatar} />
          <div className={styles.userMeta}>
            <span className={styles.userName}>{record.name}</span>
            <span className={styles.userContact}>{record.contact}</span>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      key: 'role',
      width: 110,
      render: (_: unknown, record: IUser) => (
        <span className={`${styles.roleTag} ${styles[roleStyleMap[record.role]]}`}>
          {roleLabel[record.role]}
        </span>
      ),
    },
    {
      title: '注册日期',
      dataIndex: 'registerDate',
      key: 'registerDate',
      width: 130,
      render: (d: string) => <span className={styles.dateText}>{d}</span>,
    },
    {
      title: '上次登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 170,
      render: (d: string) => <span className={styles.dateText}>{d}</span>,
    },
    {
      title: '状态',
      key: 'status',
      width: 110,
      align: 'center',
      render: (_: unknown, record: IUser) => (
        <span className={`${styles.statusBadge} ${styles[record.status]}`}>
          <span className={`${styles.statusDot} ${styles[record.status]}`} />
          {record.status === 'active' ? '正常' : '已封禁'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      align: 'right',
      render: (_: unknown, record: IUser) => (
        <div>
          <a className={styles.detailLink} onClick={() => handleDetail(record)}>
            查看详情
          </a>
          {record.status === 'active' ? (
            <Popover
              open={banPopOpen === record.uid}
              onOpenChange={(v) => setBanPopOpen(v ? record.uid : null)}
              trigger="click"
              placement="bottomRight"
              overlayClassName={styles.banPopover}
              content={
                <BanPopContent
                  userName={record.name}
                  onConfirm={(reason) => handleBan(record, reason)}
                  onCancel={() => setBanPopOpen(null)}
                />
              }
            >
              <a className={styles.banLink}>封禁</a>
            </Popover>
          ) : (
            <a className={styles.unbanLink} onClick={() => handleUnban(record)}>
              解封
            </a>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* ===== 页面标题 ===== */}
        <div className={styles.pageHeader}>
          <h2>用户管理中心</h2>
          <p>统一管理平台各类用户账户，监控用户状态与权限。</p>
        </div>

        {/* ===== 统计卡片 ===== */}
        <div className={styles.statGrid}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>用户总数</p>
              <Statistic value={12543} valueStyle={{ fontSize: 24, fontWeight: 700 }} />
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <TeamOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>今日新增用户</p>
              <Statistic value={128} valueStyle={{ fontSize: 24, fontWeight: 700 }} />
            </div>
            <div className={`${styles.statIcon} ${styles.green}`}>
              <UserAddOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>活跃用户</p>
              <Statistic value={3420} valueStyle={{ fontSize: 24, fontWeight: 700 }} />
            </div>
            <div className={`${styles.statIcon} ${styles.purple}`}>
              <RiseOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statInfo}>
              <p>被封禁账户</p>
              <Statistic value={45} valueStyle={{ fontSize: 24, fontWeight: 700 }} />
            </div>
            <div className={`${styles.statIcon} ${styles.red}`}>
              <StopOutlined />
            </div>
          </Card>
        </div>

        {/* ===== 筛选栏 ===== */}
        <div className={styles.filterCard}>
          <Form layout="vertical" className={styles.filterForm}>
            <Form.Item label="搜索用户" className={styles.searchField}>
              <Input
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                placeholder="输入用户名或手机号"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Form.Item>

            <Form.Item label="角色" className={styles.selectField}>
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { value: 'all', label: '所有角色' },
                  { value: UserRole.ADMIN, label: '管理员' },
                  { value: UserRole.MERCHANT, label: '商家' },
                  { value: UserRole.CUSTOMER, label: '客户' },
                ]}
              />
            </Form.Item>

            <Form.Item label="状态" className={styles.selectField}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: '所有状态' },
                  { value: 'active', label: '正常' },
                  { value: 'banned', label: '已封禁' },
                ]}
              />
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

        {/* ===== 表格 ===== */}
        <div className={styles.tableCard}>
          <Table<IUser>
            columns={columns}
            dataSource={data}
            rowKey="uid"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </div>
      </div>
    </div>
  )
}

export default UserManager
