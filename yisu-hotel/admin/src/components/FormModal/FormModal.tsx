import React, { useState, useCallback } from 'react'
import { Modal, App } from 'antd'
import type { ModalProps } from 'antd'

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

  const handleOk = useCallback(async () => {
    if (loading) return // 防抖保护

    try {
      setLoading(true)
      const result = onFinish()
      if (result instanceof Promise) {
        await result
      }
    } catch (err: unknown) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      if ((err as any)?.errorFields) {
        // antd 表单验证失败，静默忽略
      } else {
        message.error((err as Error)?.message || '操作失败')
      }
    } finally {
      setLoading(false)
    }
  }, [loading, onFinish, message])

  const handleCancel = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return // 提交时不允许关闭
      onCancel?.(e)
    },
    [loading, onCancel],
  )

  return (
    <Modal
      {...restProps}
      onCancel={handleCancel}
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      onOk={handleOk as any}
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      confirmLoading={(loading || (restProps as any).confirmLoading) as any}
      mask={
        restProps.mask !== false
          ? { ...((restProps.mask as object) || {}), closable: !loading && restProps.maskClosable }
          : false
      }
      closable={!loading && restProps.closable}
      keyboard={!loading && restProps.keyboard}
    >
      {children}
    </Modal>
  )
}
