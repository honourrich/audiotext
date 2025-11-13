import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 96,
    md: 112,
    lg: 128
  };
  
  const baseSize = sizeMap[size];

  return (
    <img 
      src="/Adobe Express - file.png" 
      alt="AudioText logo" 
      width={baseSize}
      height={baseSize}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
