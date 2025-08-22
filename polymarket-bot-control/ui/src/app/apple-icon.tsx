import { ImageResponse } from 'next/og'

export const size = {
  width: 256,
  height: 256,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #F8FDFC 0%, #A5FFD6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Robot Head Base */}
          <rect x="25" y="20" width="50" height="45" rx="8" fill="#FF686B" stroke="#FFFFFF" strokeWidth="2"/>
          
          {/* Robot Eyes */}
          <circle cx="35" cy="35" r="4" fill="#FFFFFF"/>
          <circle cx="65" cy="35" r="4" fill="#FFFFFF"/>
          <circle cx="35" cy="35" r="2" fill="#FF686B"/>
          <circle cx="65" cy="35" r="2" fill="#FF686B"/>
          
          {/* Robot Antenna */}
          <line x1="40" y1="20" x2="40" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
          <line x1="60" y1="20" x2="60" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="40" cy="10" r="2" fill="#FFFFFF"/>
          <circle cx="60" cy="10" r="2" fill="#FFFFFF"/>
          
          {/* Robot Mouth/Display Screen */}
          <rect x="35" y="45" width="30" height="12" rx="2" fill="#FFFFFF"/>
          
          {/* Market Chart Lines on Display */}
          <polyline points="38,52 42,49 46,51 50,47 54,48 58,45 62,46" stroke="#FF686B" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Robot Body */}
          <rect x="30" y="65" width="40" height="25" rx="4" fill="#FFFFFF" stroke="#FF686B" strokeWidth="2"/>
          
          {/* Control Buttons */}
          <circle cx="40" cy="72" r="2" fill="#FF686B"/>
          <circle cx="50" cy="72" r="2" fill="#84DCC6"/>
          <circle cx="60" cy="72" r="2" fill="#FFA69E"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
