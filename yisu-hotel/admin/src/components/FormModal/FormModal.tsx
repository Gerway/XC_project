import React, { useState, useCallback } from 'react'
import { Modal, ModalProps, App } from 'antd'

export interface FormModalProps extends Omit<ModalProps, 'onOk' | 'confirmLoading'> {
  /**
   * 异步的确认回调，组件内部会根据此函数的状态自动维护 confirmLoading
   */
  onFinish: () => Promise<void> | void
}

export const FormModal: React.FC<FormModalProps> = ({
  onFinish,
  onCancel,
  children,
  ...restProps
}) => {
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const handleOk = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return // 防抖保护

      try {
        setLoading(true)
        const result = onFinish()
        if (result instanceof Promise) {
          await result
        }
      } catch (err: any) {
        if (err?.errorFields) {
          // antd form validation failed, silently ignore
        } else {
          message.error(err?.message || '操作失败')
        }
      } finally {
        setLoading(false)
      }
    },
    [loading, onFinish, message],
  )

  const handleCancel = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return // submitting 时不允许关闭
      onCancel?.(e)
    },
    [loading, onCancel],
  )

  return (
    <Modal
      {...restProps}
      onCancel={handleCancel}
      onOk={handleOk as any}
      confirmLoading={(loading || (restProps as any).confirmLoading) as any}
      maskClosable={!loading && restProps.maskClosable}
      closable={!loading && restProps.closable}
      keyboard={!loading && restProps.keyboard}
    >
      {children}
    </Modal>
  )
}
