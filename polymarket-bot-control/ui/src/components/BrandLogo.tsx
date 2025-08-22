import React from 'react';
import Logo from './Logo';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className = '' 
}) => {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  if (variant === 'icon') {
    return <Logo size={size} className={className} />;
  }

  if (variant === 'text') {
    return (
      <div className={`font-bold text-primary ${textSizes[size]} ${className}`}>
        PolyBot
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      <div className={`font-bold text-primary ${textSizes[size]}`}>
        PolyBot
      </div>
    </div>
  );
};

export default BrandLogo;
