import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Sfondo circolare flat */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
        </defs>
        
        {/* Cerchio di sfondo */}
        <circle cx="50" cy="50" r="48" fill="#E0F2FE" stroke="#BAE6FD" strokeWidth="2"/>
        
        {/* Corpo del bot (forma esagonale arrotondata) */}
        <path
          d="M30 35 L70 35 Q75 35 75 40 L75 60 Q75 65 70 65 L30 65 Q25 65 25 60 L25 40 Q25 35 30 35 Z"
          fill="#38BDF8"
          stroke="#0EA5E9"
          strokeWidth="1.5"
        />
        
        {/* Occhi del bot */}
        <circle cx="38" cy="45" r="4" fill="#1E293B" />
        <circle cx="62" cy="45" r="4" fill="#1E293B" />
        <circle cx="39" cy="44" r="1.5" fill="#F8FAFC" />
        <circle cx="63" cy="44" r="1.5" fill="#F8FAFC" />
        
        {/* Bocca del bot (sorriso) */}
        <path
          d="M42 55 Q50 60 58 55"
          stroke="#1E293B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Elementi di liquidità (onde fluide) */}
        <path
          d="M15 25 Q25 20 35 25 Q45 30 55 25 Q65 20 75 25 Q85 30 95 25"
          stroke="#C084FC"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M10 75 Q20 70 30 75 Q40 80 50 75 Q60 70 70 75 Q80 80 90 75"
          stroke="#C084FC"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        
        {/* Particelle dati intorno al bot */}
        <circle cx="20" cy="40" r="2" fill="#FBBF24" opacity="0.8">
          <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="80" cy="35" r="1.5" fill="#FBBF24" opacity="0.8">
          <animate attributeName="r" values="1.5;2.5;1.5" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="15" cy="60" r="1.8" fill="#FBBF24" opacity="0.8">
          <animate attributeName="r" values="1.8;2.8;1.8" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="85" cy="65" r="2.2" fill="#FBBF24" opacity="0.8">
          <animate attributeName="r" values="2.2;3.2;2.2" dur="2.2s" repeatCount="indefinite"/>
        </circle>
        
        {/* Simbolo dollaro stilizzato (rappresenta il trading) */}
        <text x="50" y="75" textAnchor="middle" fontSize="8" fill="#A855F7" fontWeight="bold">
          $
        </text>
      </svg>
    </div>
  )
}

export default Logo
