import React from 'react'
import { Input, Button } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import type { IRoom } from '@yisu/shared'
import styles from './Inventory.module.scss'

interface RoomListProps {
  rooms: IRoom[]
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
}

const RoomList: React.FC<RoomListProps> = ({ rooms, selectedRoomId, onSelectRoom }) => {
  return (
    <div className={styles.roomListPanel}>
      <div className={styles.roomListHeader}>
        <h2>房型列表</h2>
        <div className={styles.searchRow}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="搜索房型..."
            className={styles.roomSearchInput}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 8, height: 36, width: 36, padding: 0 }}
          />
        </div>
      </div>

      <div className={styles.roomCards}>
        {rooms.map((room) => {
          const isActive = room.id === selectedRoomId
          return (
            <div
              key={room.id}
              className={`${styles.roomCard} ${isActive ? styles.active : ''}`}
              onClick={() => onSelectRoom(room.id)}
            >
              <div className={styles.roomCardContent}>
                <div>
                  <p className={`${styles.roomName} ${isActive ? styles.activeText : ''}`}>
                    {room.name}
                  </p>
                  <p className={styles.roomPrice}>基础价: ¥{room.basePrice}</p>
                  <p className={styles.roomId}>ID: {room.id}</p>
                </div>
                <button type="button" className={styles.editBtn}>
                  <EditOutlined style={{ fontSize: 14 }} />
                </button>
              </div>
              <span
                className={`${styles.statusDot} ${room.isActive ? styles.online : styles.offline}`}
                title={room.isActive ? '在售' : '下架'}
              />
            </div>
          )
        })}
      </div>

      <div className={styles.roomListFooter}>
        <button type="button">加载更多...</button>
      </div>
    </div>
  )
}

export default RoomList
