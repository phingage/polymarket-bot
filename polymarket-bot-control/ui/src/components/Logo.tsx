import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Robot Head Base */}
        <rect
          x="25"
          y="20"
          width="50"
          height="45"
          rx="8"
          fill="#FF686B"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        
        {/* Robot Eyes */}
        <circle cx="35" cy="35" r="4" fill="#FFFFFF" />
        <circle cx="65" cy="35" r="4" fill="#FFFFFF" />
        <circle cx="35" cy="35" r="2" fill="#FF686B" />
        <circle cx="65" cy="35" r="2" fill="#FF686B" />
        
        {/* Robot Antenna */}
        <line x1="40" y1="20" x2="40" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="20" x2="60" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="10" r="2" fill="#FFFFFF" />
        <circle cx="60" cy="10" r="2" fill="#FFFFFF" />
        
        {/* Robot Mouth/Display Screen */}
        <rect
          x="35"
          y="45"
          width="30"
          height="12"
          rx="2"
          fill="#FFFFFF"
        />
        
        {/* Market Chart Lines on Display */}
        <polyline
          points="38,52 42,49 46,51 50,47 54,48 58,45 62,46"
          stroke="#FF686B"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Robot Body */}
        <rect
          x="30"
          y="65"
          width="40"
          height="25"
          rx="4"
          fill="#FFFFFF"
          stroke="#FF686B"
          strokeWidth="2"
        />
        
        {/* Control Buttons */}
        <circle cx="40" cy="72" r="2" fill="#FF686B" />
        <circle cx="50" cy="72" r="2" fill="#84DCC6" />
        <circle cx="60" cy="72" r="2" fill="#FFA69E" />
        
        {/* Robot Arms with Market Indicators */}
        <rect x="18" y="70" width="12" height="6" rx="3" fill="#FF686B" />
        <rect x="70" y="70" width="12" height="6" rx="3" fill="#FF686B" />
        
        {/* Percentage Indicators */}
        <text x="24" y="75" fontSize="4" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">%</text>
        <text x="76" y="75" fontSize="4" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">$</text>
        
        {/* Market Trend Arrows */}
        <polygon points="15,82 20,77 20,80 25,80 25,84 20,84 20,87" fill="#84DCC6" />
        <polygon points="85,87 80,82 80,85 75,85 75,89 80,89 80,92" fill="#FFA69E" />
        
        {/* Base Platform */}
        <ellipse cx="50" cy="92" rx="20" ry="3" fill="#84DCC6" opacity="0.6" />
      </svg>
    </div>
  );
};

export default Logo;
