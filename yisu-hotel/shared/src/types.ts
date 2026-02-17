export enum HotelStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export interface IHotel {
  id: string
  name: string
  submissionDate: string
  status: HotelStatus
  rejectionReason?: string
  address?: string
  description?: string
}

export interface IStatCardData {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  description: string
  colorClass: string // e.g., 'primary', 'success', 'warning'
}
