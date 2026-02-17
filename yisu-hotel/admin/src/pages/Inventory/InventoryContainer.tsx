import React, { useState, useMemo } from 'react'
import type { IRoom, IDayInventory } from '@yisu/shared'
import RoomList from './RoomList'
import InventoryCalendar from './InventoryCalendar'
import styles from './Inventory.module.scss'

// Mock Data: Room types
const mockRooms: IRoom[] = [
  { id: 'R-102', name: '豪华大床房', basePrice: 580, isActive: true },
  { id: 'R-103', name: '标准双床房', basePrice: 380, isActive: true },
  { id: 'R-105', name: '行政套房', basePrice: 1280, isActive: false },
  { id: 'R-108', name: '海景家庭房', basePrice: 880, isActive: true },
]

// Mock Data: Generate inventory for October 2023
const generateMockInventory = (roomId: string): IDayInventory[] => {
  const data: IDayInventory[] = []
  const basePrice =
    roomId === 'R-102' ? 580 : roomId === 'R-103' ? 380 : roomId === 'R-105' ? 1280 : 880

  for (let day = 1; day <= 31; day++) {
    const dateStr = `2023-10-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(2023, 9, day).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Weekend pricing + low stock simulation
    const price = isWeekend ? basePrice + 100 : basePrice
    let stock = 8

    // Simulate varied stock
    if (day === 3 || day === 14 || day === 21 || day === 28) stock = 10
    if (day === 7 || day === 9) stock = 9
    if (day === 2) stock = 5
    if (day === 10 || day === 11) stock = 6
    if (day === 4) stock = 6
    if (day === 11) stock = 3
    if (day === 18) stock = 7
    if (day === 5 || day === 19) stock = 1
    if (day === 6 || day === 12 || day === 27) stock = 0
    if (day === 13 || day === 20 || day === 26) stock = 2

    data.push({ date: dateStr, price, stock })
  }
  return data
}

const InventoryContainer: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('R-102')

  const selectedRoom = useMemo(
    () => mockRooms.find((r) => r.id === selectedRoomId) || null,
    [selectedRoomId],
  )

  const inventoryData = useMemo(
    () => (selectedRoomId ? generateMockInventory(selectedRoomId) : []),
    [selectedRoomId],
  )

  return (
    <div className={styles.container}>
      <div className={styles.splitView}>
        <RoomList
          rooms={mockRooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
        />
        <InventoryCalendar room={selectedRoom} inventoryData={inventoryData} />
      </div>
      <div className={styles.footer}>© 2026 易宿酒店平台。保留所有权利。</div>
    </div>
  )
}

export default InventoryContainer
