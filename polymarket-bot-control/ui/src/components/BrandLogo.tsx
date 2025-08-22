import React from 'react';
import Logo from './Logo';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'default' | 'sidebar';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className = '',
  theme = 'default'
}) => {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const textColor = theme === 'sidebar' 
    ? { color: 'var(--sidebar-text)' }
    : { color: 'var(--primary)' };

  if (variant === 'icon') {
    return <Logo size={size} className={className} />;
  }

  if (variant === 'text') {
    return (
      <div className={`font-bold ${textSizes[size]} ${className}`} style={textColor}>
        PolyBot
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      <div className={`font-bold ${textSizes[size]}`} style={textColor}>
        PolyBot
      </div>
    </div>
  );
};

export default BrandLogo;
