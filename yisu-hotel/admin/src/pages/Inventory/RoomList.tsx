import React from 'react'
import { Button } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { IRoomWithStock } from '../../api/room'
import styles from './Inventory.module.scss'

interface RoomListProps {
  rooms: IRoomWithStock[]
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
  onCreateRoom: () => void
  onDeleteRoom: (room: IRoomWithStock) => void
}

const RoomList: React.FC<RoomListProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onCreateRoom,
  onDeleteRoom,
}) => {
  return (
    <div className={styles.roomListPanel}>
      <div className={styles.roomListHeader}>
        <h2>房型列表</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateRoom}
            style={{ flexShrink: 0 }}
          >
            全新房型
          </Button>
        </div>
      </div>
      <div className={styles.roomCards}>
        {rooms.map((room) => {
          const isActive = room.room_id === selectedRoomId
          return (
            <div
              key={room.room_id}
              className={`${styles.roomCard} ${isActive ? styles.active : ''}`}
              onClick={() => onSelectRoom(room.room_id)}
            >
              <div className={styles.roomCardContent}>
                <div>
                  <p className={`${styles.roomName} ${isActive ? styles.activeText : ''}`}>
                    {room.name}
                  </p>
                  <p className={styles.roomPrice}>门市价: ¥{room.ori_price || 0}</p>
                  <p className={styles.roomId}>ID: {room.room_id}</p>
                </div>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteRoom(room)
                  }}
                  title="删除该房型"
                >
                  <DeleteOutlined style={{ fontSize: 14, color: '#ff4d4f' }} />
                </button>
              </div>
              <span className={`${styles.statusDot} ${styles.online}`} title="已创建" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RoomList
