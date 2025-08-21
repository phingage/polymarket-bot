import { ImageResponse } from 'next/og'
 
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 16,
          background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
        }}
      >
        {/* Bot icon simplified for favicon */}
        <div
          style={{
            width: 24,
            height: 20,
            background: 'linear-gradient(135deg, #7DD3FC 0%, #38BDF8 100%)',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Eyes */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
            <div style={{ width: 2, height: 2, background: '#1E293B', borderRadius: '50%' }}></div>
            <div style={{ width: 2, height: 2, background: '#1E293B', borderRadius: '50%' }}></div>
          </div>
          {/* Smile */}
          <div
            style={{
              width: 6,
              height: 3,
              border: '1px solid #1E293B',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
            }}
          ></div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
