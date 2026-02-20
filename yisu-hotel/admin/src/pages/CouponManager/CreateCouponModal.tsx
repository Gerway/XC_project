import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Radio, DatePicker, Switch, Space } from 'antd'
import type { Dayjs } from 'dayjs'
import styles from './CouponManager.module.scss'

// ===== 类型定义 =====
type DiscountType = 'AMOUNT_OFF' | 'PERCENT_OFF'
type ColorTheme = 'red' | 'orange' | 'blue' | 'purple' | 'green'

interface ICoupon {
  id: string
  name: string
  discountType: DiscountType
  discountLabel: string
  startDate: string
  endDate: string
  total: number
  used: number
  active: boolean
  color: ColorTheme
}

interface CreateCouponModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (coupon: ICoupon) => void
}

// ===== 颜色主题配置 =====
const colorOptions: { value: ColorTheme; label: string; hex: string }[] = [
  { value: 'red', label: '红色', hex: '#ef4444' },
  { value: 'orange', label: '橙色', hex: '#f97316' },
  { value: 'blue', label: '蓝色', hex: '#3b82f6' },
  { value: 'purple', label: '紫色', hex: '#8b5cf6' },
  { value: 'green', label: '绿色', hex: '#22c55e' },
]

// ===== 表单字段类型 =====
interface FormValues {
  name: string
  discountType: DiscountType
  threshold: number
  discountValue: number
  dateRange: [Dayjs, Dayjs]
  unlimited: boolean
  total: number
  color: ColorTheme
}

// ===== 组件 =====
const CreateCouponModal: React.FC<CreateCouponModalProps> = ({ open, onCancel, onSubmit }) => {
  const [form] = Form.useForm<FormValues>()
  const discountType = Form.useWatch('discountType', form)
  const unlimited = Form.useWatch('unlimited', form)

  // 弹窗打开时重置表单
  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  // 生成折扣描述文本
  const buildDiscountLabel = (values: FormValues): string => {
    if (values.discountType === 'AMOUNT_OFF') {
      return `满${values.threshold}减${values.discountValue}`
    }
    return `${values.discountValue}折优惠`
  }

  // 生成自动 ID
  const generateId = (): string => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 900) + 100)
    return `CP-${y}${m}${d}${rand}`
  }

  // 提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const [start, end] = values.dateRange
      const coupon: ICoupon = {
        id: generateId(),
        name: values.name,
        discountType: values.discountType,
        discountLabel: buildDiscountLabel(values),
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
        total: values.unlimited ? -1 : values.total,
        used: 0,
        active: true,
        color: values.color,
      }
      onSubmit(coupon)
    } catch {
      // 表单验证失败，自动显示错误高亮
    }
  }

  return (
    <Modal
      title="创建新优惠券"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="创建"
      cancelText="取消"
      width={560}
      destroyOnClose
      className={styles.createModal}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          discountType: 'AMOUNT_OFF',
          threshold: 300,
          discountValue: 50,
          unlimited: false,
          total: 1000,
          color: 'blue',
        }}
        className={styles.createForm}
      >
        {/* 优惠券名称 */}
        <Form.Item
          label="优惠券名称"
          name="name"
          rules={[
            { required: true, message: '请输入优惠券名称' },
            { max: 30, message: '名称不能超过30个字符' },
          ]}
        >
          <Input placeholder="例如：新用户注册专享" maxLength={30} showCount />
        </Form.Item>

        {/* 折扣类型 */}
        <Form.Item label="折扣类型" name="discountType" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid" className={styles.discountTypeRadio}>
            <Radio.Button value="AMOUNT_OFF">满减</Radio.Button>
            <Radio.Button value="PERCENT_OFF">折扣</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* 折扣规则 */}
        <div className={styles.discountRuleRow}>
          {discountType === 'AMOUNT_OFF' ? (
            <>
              <Form.Item
                label="满额条件（元）"
                name="threshold"
                rules={[{ required: true, message: '请输入满额条件' }]}
                className={styles.ruleField}
              >
                <InputNumber
                  min={1}
                  max={99999}
                  placeholder="300"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
              <Form.Item
                label="减免金额（元）"
                name="discountValue"
                rules={[{ required: true, message: '请输入减免金额' }]}
                className={styles.ruleField}
              >
                <InputNumber
                  min={1}
                  max={99999}
                  placeholder="50"
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label="折扣（如 8.5 表示 8.5 折）"
              name="discountValue"
              rules={[
                { required: true, message: '请输入折扣' },
                {
                  type: 'number',
                  min: 0.1,
                  max: 9.9,
                  message: '折扣范围 0.1~9.9',
                },
              ]}
              className={styles.ruleField}
            >
              <InputNumber
                min={0.1}
                max={9.9}
                step={0.5}
                placeholder="8.5"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        </div>

        {/* 有效期 */}
        <Form.Item
          label="有效期"
          name="dateRange"
          rules={[{ required: true, message: '请选择有效期' }]}
        >
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* 发放总量 */}
        <div className={styles.quantityRow}>
          <Form.Item
            label="发放总量"
            name="total"
            rules={[
              {
                required: !unlimited,
                message: '请输入发放总量',
              },
            ]}
            className={styles.quantityField}
          >
            <InputNumber
              min={1}
              max={999999}
              placeholder="1000"
              style={{ width: '100%' }}
              disabled={unlimited}
            />
          </Form.Item>
          <Form.Item
            label="不限量"
            name="unlimited"
            valuePropName="checked"
            className={styles.unlimitedSwitch}
          >
            <Switch />
          </Form.Item>
        </div>

        {/* 颜色主题 */}
        <Form.Item
          label="颜色主题"
          name="color"
          rules={[{ required: true, message: '请选择颜色主题' }]}
        >
          <Radio.Group className={styles.colorRadioGroup}>
            {colorOptions.map((opt) => (
              <Radio key={opt.value} value={opt.value}>
                <Space align="center" size={6}>
                  <span className={styles.colorDot} style={{ background: opt.hex }} />
                  {opt.label}
                </Space>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateCouponModal
