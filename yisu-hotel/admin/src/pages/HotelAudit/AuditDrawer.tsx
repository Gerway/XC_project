import React, { useState } from 'react'
import { Drawer, Descriptions, Image, Tag, Timeline, Input, Button, App } from 'antd'
import {
  CloseOutlined,
  CheckOutlined,
  WifiOutlined,
  CarOutlined,
  CoffeeOutlined,
  TeamOutlined,
  DesktopOutlined,
} from '@ant-design/icons'
import { HotelStatus } from '@yisu/shared'
import styles from './AuditDrawer.module.scss'

// ===== 类型定义 =====
/** 审核抽屉详情数据 */
export interface IAuditDetail {
  /** 酒店 ID */
  id: string
  /** 申请编号 */
  applicationNo: string
  /** 酒店名称 */
  hotelName: string
  /** 所属商家 */
  merchantName: string
  /** 商家 ID */
  merchantId: string
  /** 联系电话 */
  phone: string
  /** 详细地址 */
  address: string
  /** 申请时间 */
  applyTime: string
  /** 酒店描述 */
  description: string
  /** 内部备注 */
  remark?: string
  /** 当前状态 */
  status: HotelStatus

  // 追加新增字段
  cityName?: string
  latitude?: number | string
  longitude?: number | string
  hotelType?: number
  starRating?: number
  openTime?: string
  closeTime?: string

  /** 酒店实景图 URL 列表 */
  scenePhotos: string[]
  /** 设施标签列表 */
  facilities: string[]
}

// 辅助函数
const getHotelTypeLabel = (type?: number) => {
  const map: Record<number, string> = {
    1: '经济型',
    2: '舒适型',
    3: '高档型',
    4: '豪华型',
    5: '度假型',
    6: '民宿',
  }
  return type ? map[type] || String(type) : '-'
}

const getStarRatingLabel = (rating?: number) => {
  const map: Record<number, string> = {
    5: '5星级',
    4: '4星级',
    3: '3星级',
    2: '2星级',
    1: '1星级',
    0: '精选',
  }
  return rating !== undefined && rating !== null ? map[rating] || String(rating) : '-'
}

export interface AuditDrawerProps {
  /** 是否可见 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 审核详情数据 */
  detail: IAuditDetail | null
  /** 通过回调 */
  onApprove?: (hotelId: string, remark: string) => void
  /** 驳回回调 */
  onReject?: (hotelId: string, remark: string) => void
}

// ===== 设施图标映射 =====
const facilityIcons: Record<string, React.ReactNode> = {
  免费WiFi: <WifiOutlined />,
  免费停车: <CarOutlined />,
  健身房: <TeamOutlined />,
  自助早餐: <CoffeeOutlined />,
  会议室: <DesktopOutlined />,
}

// ===== 组件 =====
const AuditDrawer: React.FC<AuditDrawerProps> = ({
  open,
  onClose,
  detail,
  onApprove,
  onReject,
}) => {
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { message } = App.useApp()

  // 重置
  const handleClose = () => {
    setRemark('')
    setSubmitting(false)
    onClose()
  }

  // 通过
  const handleApprove = () => {
    if (!detail) return
    setSubmitting(true)
    if (onApprove) {
      onApprove(detail.id, remark)
    } else {
      message.success(`已通过「${detail.hotelName}」的入驻审核`)
    }
    setTimeout(() => {
      setSubmitting(false)
      handleClose()
    }, 500)
  }

  // 驳回
  const handleReject = () => {
    if (!detail) return
    if (!remark.trim()) {
      message.warning('驳回时必须填写审核备注')
      return
    }
    setSubmitting(true)
    if (onReject) {
      onReject(detail.id, remark)
    } else {
      message.error(`已驳回「${detail.hotelName}」的入驻申请`)
    }
    setTimeout(() => {
      setSubmitting(false)
      handleClose()
    }, 500)
  }

  if (!detail) return null

  // ===== Header =====
  const drawerTitle = (
    <div className={styles.headerTitle}>
      <h3>酒店入驻审核</h3>
      <p>申请编号: {detail.applicationNo}</p>
    </div>
  )

  // ===== Footer =====
  const drawerFooter = (
    <div className={styles.footerContainer}>
      <div className={styles.remarkInput}>
        <Input.TextArea
          rows={1}
          placeholder="审核备注 (驳回时必填)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      </div>
      <div className={styles.footerActions}>
        <Button
          className={styles.rejectBtn}
          icon={<CloseOutlined />}
          onClick={handleReject}
          loading={submitting}
        >
          驳回
        </Button>
        <Button
          className={styles.approveBtn}
          icon={<CheckOutlined />}
          onClick={handleApprove}
          loading={submitting}
        >
          通过
        </Button>
      </div>
    </div>
  )

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      size="large"
      title={drawerTitle}
      footer={drawerFooter}
      className={styles.drawer}
      destroyOnHidden
    >
      <div className={styles.drawerBody}>
        {/* ===== 1. 基本信息 ===== */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            <span className={styles.titleBar} />
            基本信息
          </div>
          <Descriptions
            column={2}
            colon={false}
            className={styles.descriptions}
            styles={{ label: { width: 100 } }}
          >
            <Descriptions.Item label="酒店名称">{detail.hotelName}</Descriptions.Item>
            <Descriptions.Item label="城市">{detail.cityName || '-'}</Descriptions.Item>

            <Descriptions.Item label="详细地址">{detail.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="经纬度">
              {detail.longitude || '-'}, {detail.latitude || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="酒店类型">
              {getHotelTypeLabel(detail.hotelType)}
            </Descriptions.Item>
            <Descriptions.Item label="星级">
              {getStarRatingLabel(detail.starRating)}
            </Descriptions.Item>

            <Descriptions.Item label="营业时间">
              {detail.openTime && detail.closeTime
                ? `${detail.openTime} - ${detail.closeTime}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">{detail.phone}</Descriptions.Item>

            <Descriptions.Item label="所属商家" span={2}>
              {detail.merchantName} (Enterprise ID: {detail.merchantId})
            </Descriptions.Item>
            <Descriptions.Item label="申请时间" span={2}>
              {detail.applyTime}
            </Descriptions.Item>
            <Descriptions.Item label="内部备注" span={2}>
              {detail.remark || '（无）'}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* ===== 2. 酒店图片 ===== */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            <span className={styles.titleBar} />
            酒店图片
          </div>
          <Image.PreviewGroup>
            <div className={styles.sceneGrid}>
              {detail.scenePhotos.map((url, idx) => (
                <div key={idx} className={styles.sceneImageWrapper}>
                  <Image
                    src={url}
                    alt={`酒店实景 ${idx + 1}`}
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </Image.PreviewGroup>
        </div>

        {/* ===== 3. 设施与服务 ===== */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            <span className={styles.titleBar} />
            设施与服务
          </div>
          <p className={styles.facilityDescription}>{detail.description}</p>
          <div className={styles.tagList}>
            {detail.facilities.map((f) => (
              <Tag key={f} icon={facilityIcons[f] || null}>
                {f}
              </Tag>
            ))}
          </div>
        </div>

        {/* ===== 4. 审核记录 ===== */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            <span className={styles.titleBar} />
            审核记录
          </div>
          <Timeline
            className={styles.timeline}
            items={[
              {
                color: 'gray',
                content: (
                  <>
                    <div className="timelineDate">{detail.applyTime}</div>
                    <div className="timelineText">商家提交入驻申请</div>
                  </>
                ),
              },
              {
                color: '#137fec',
                content: (
                  <>
                    <div className="timelineDate">当前</div>
                    <div className="timelineText">等待管理员审核</div>
                  </>
                ),
              },
            ]}
          />
        </div>
      </div>
    </Drawer>
  )
}

export default AuditDrawer
