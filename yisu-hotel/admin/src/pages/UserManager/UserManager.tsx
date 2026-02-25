import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Button, Input, Card, Statistic, Select, Avatar, Popover, Form, App } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  RiseOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { UserRole } from '@yisu/shared'
import { userApi } from '../../api/user'
import styles from './UserManager.module.scss'
import { StatusTag } from '../../components/StatusTag'

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

// ===== API 动态数据 =====

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
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, bannedUsers: 0 })
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total, range) =>
      `显示 ${range[0]} 到 ${range[1]} 条，共 ${total.toLocaleString()} 条结果`,
  })
  const { message } = App.useApp()

  const fetchStats = useCallback(async () => {
    try {
      const res = (await userApi.getUserStats()) as unknown as {
        totalUsers: number
        activeUsers: number
        bannedUsers: number
      }
      setStats({
        totalUsers: res.totalUsers || 0,
        activeUsers: res.activeUsers || 0,
        bannedUsers: res.bannedUsers || 0,
      })
    } catch (error) {
      console.error('获取统计数据失败', error)
    }
  }, [])

  const fetchUsers = useCallback(
    async (
      page = 1,
      pageSize = 10,
      overrides?: { search?: string; role?: string; status?: string },
    ) => {
      setLoading(true)
      try {
        const res = (await userApi.getUserList({
          page,
          pageSize,
          search: overrides?.search ?? searchText,
          role: overrides?.role ?? roleFilter,
          status: overrides?.status ?? statusFilter,
        })) as unknown as { data: IUser[]; total: number }
        setData(res.data || [])
        setPagination((prev) => ({ ...prev, current: page, pageSize, total: res.total || 0 }))
      } catch (error) {
        message.error((error as Error).message || '获取用户列表失败')
      } finally {
        setLoading(false)
      }
    },
    [searchText, roleFilter, statusFilter, message],
  )

  useEffect(() => {
    fetchStats()
    fetchUsers(1, 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 分页
  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchUsers(pag.current || 1, pag.pageSize || 10)
  }

  // 筛选
  const handleFilter = () => {
    fetchUsers(1, pagination.pageSize || 10)
  }

  // 重置
  const handleReset = () => {
    setSearchText('')
    setRoleFilter('all')
    setStatusFilter('all')
    fetchUsers(1, pagination.pageSize || 10, { search: '', role: 'all', status: 'all' })
  }

  // 封禁
  const handleBan = useCallback(
    async (record: IUser, reason: string) => {
      setBanPopOpen(null)
      try {
        await userApi.updateUserStatus(record.uid, 'banned')
        message.success(`已封禁用户「${record.name}」${reason ? `，原因：${reason}` : ''}`)
        fetchStats()
        fetchUsers(pagination.current, pagination.pageSize)
      } catch (error) {
        message.error((error as Error).message || '封禁失败')
      }
    },
    [message, pagination, fetchStats, fetchUsers],
  )

  // 解封
  const handleUnban = useCallback(
    async (record: IUser) => {
      try {
        await userApi.updateUserStatus(record.uid, 'active')
        message.success(`已解封用户「${record.name}」`)
        fetchStats()
        fetchUsers(pagination.current, pagination.pageSize)
      } catch (error) {
        message.error((error as Error).message || '解封失败')
      }
    },
    [message, pagination, fetchStats, fetchUsers],
  )

  // ===== 列定义 =====
  const columns = useMemo<ColumnsType<IUser>>(
    () => [
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
          <StatusTag
            color={record.status === 'active' ? 'success' : 'error'}
            statusText={record.status === 'active' ? '正常' : '已封禁'}
          />
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'right',
        render: (_: unknown, record: IUser) => (
          <div>
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
    ],
    [handleBan, handleUnban, banPopOpen, setBanPopOpen],
  )

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
          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>用户总数</p>
              <Statistic
                value={stats.totalUsers}
                styles={{ content: { fontSize: 24, fontWeight: 700 } }}
              />
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <TeamOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>活跃用户</p>
              <Statistic
                value={stats.activeUsers}
                styles={{ content: { fontSize: 24, fontWeight: 700 } }}
              />
            </div>
            <div className={`${styles.statIcon} ${styles.purple}`}>
              <RiseOutlined />
            </div>
          </Card>

          <Card className={styles.statCard} variant="borderless">
            <div className={styles.statInfo}>
              <p>被封禁账户</p>
              <Statistic
                value={stats.bannedUsers}
                styles={{ content: { fontSize: 24, fontWeight: 700 } }}
              />
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
                placeholder="输入用户名或邮箱"
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
