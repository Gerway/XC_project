import React from 'react'
import { Tag } from 'antd'
import type { TagProps } from 'antd'

export interface StatusTagProps extends Omit<TagProps, 'children'> {
  statusText: React.ReactNode
  showDot?: boolean
}

export const StatusTag: React.FC<StatusTagProps> = ({
  statusText,
  showDot = true,
  style,
  ...rest
}) => {
  return (
    <Tag style={{ borderRadius: 12, padding: '0 10px', ...style }} {...rest}>
      {showDot && <span style={{ marginRight: 4 }}>•</span>}
      {statusText}
    </Tag>
  )
}
