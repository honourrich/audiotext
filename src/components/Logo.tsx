import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { text: 'text-lg', spacing: 'tracking-tight' },
    md: { text: 'text-xl', spacing: 'tracking-tight' },
    lg: { text: 'text-2xl', spacing: 'tracking-normal' },
    hero: { text: 'text-4xl md:text-5xl', spacing: 'tracking-wide' }
  };
  
  const config = sizeMap[size];
  const fontWeight = size === 'hero' ? 800 : size === 'lg' ? 700 : 600;

  return (
    <span 
      className={`font-bold ${config.text} ${config.spacing} ${className}`}
      style={{
        background: 'linear-gradient(90deg, #14B8A6 0%, #06B6D4 25%, #3B82F6 50%, #8B5CF6 75%, #6366F1 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontFamily: "'Inter', sans-serif",
        fontWeight: fontWeight,
        letterSpacing: size === 'hero' ? '0.03em' : size === 'lg' ? '0.02em' : '-0.01em',
        display: 'inline-block',
      }}
    >
      audiotext.app
    </span>
  );
};

export default Logo;
