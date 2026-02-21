import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch } from 'antd'
import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import styles from './CouponManager.module.scss'
import type { CouponCreateParams } from '../../api/coupon'

interface CreateCouponModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (coupon: CouponCreateParams) => void
}

// ===== 表单字段类型 =====
interface FormValues {
  title: string
  min_spend: number
  discount_amount: number
  dateRange: [Dayjs, Dayjs]
  unlimited: boolean
  total_count: number
}

// ===== 组件 =====
const CreateCouponModal: React.FC<CreateCouponModalProps> = ({ open, onCancel, onSubmit }) => {
  const [form] = Form.useForm<FormValues>()
  const unlimited = Form.useWatch('unlimited', form)

  // 弹窗打开时重置表单
  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  // 提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const [start, end] = values.dateRange

      const couponParams: CouponCreateParams = {
        title: values.title,
        min_spend: values.min_spend,
        discount_amount: values.discount_amount,
        start_time: start.format('YYYY-MM-DD 00:00:00'),
        end_time: end.format('YYYY-MM-DD 23:59:59'),
        total_count: values.unlimited ? -1 : values.total_count,
      }
      onSubmit(couponParams)
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
      width={520}
      forceRender
      className={styles.modal}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          min_spend: 300,
          discount_amount: 50,
          unlimited: false,
          total_count: 1000,
        }}
        className={styles.createForm}
      >
        {/* 优惠券名称 */}
        <Form.Item
          label="优惠券名称"
          name="title"
          rules={[
            { required: true, message: '请输入优惠券标题' },
            { max: 30, message: '标题不能超过30个字符' },
          ]}
        >
          <Input placeholder="例如：新用户注册专享" maxLength={30} showCount />
        </Form.Item>

        {/* 折扣规则 */}
        <div className={styles.discountRuleRow}>
          <Form.Item
            label="满额条件（元）"
            name="min_spend"
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
            name="discount_amount"
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
        </div>

        {/* 有效期 */}
        <Form.Item
          label="有效期"
          name="dateRange"
          rules={[{ required: true, message: '请选择有效期' }]}
        >
          <DatePicker.RangePicker
            showTime={{ format: 'HH:mm:ss' }}
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        </Form.Item>

        {/* 发放总量 */}
        <div className={styles.quantityRow}>
          <Form.Item
            label="发放总量"
            name="total_count"
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
      </Form>
    </Modal>
  )
}

export default CreateCouponModal
