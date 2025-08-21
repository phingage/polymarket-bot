import React, { useEffect } from 'react'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  show: boolean
  onClose: () => void
  duration?: number
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type, 
  show, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show) return null

  const typeConfig = {
    success: {
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-700',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-700',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-700',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const config = typeConfig[type]

  return (
    <div className="fixed top-4 right-4 z-50 slide-in-right">
      <div className={`${config.bg} ${config.border} ${config.text} border px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm max-w-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {config.icon}
            <span className="font-medium text-sm">{message}</span>
          </div>
          <button
            onClick={onClose}
            className="ml-4 hover:opacity-70 transition-opacity"
            title="Chiudi notifica"
            aria-label="Chiudi notifica"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Notification
