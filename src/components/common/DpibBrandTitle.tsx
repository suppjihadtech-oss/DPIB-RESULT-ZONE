import React from 'react';

interface DpibBrandTitleProps {
  className?: string;
  style?: React.CSSProperties;
}

export const VIOLET_GRADIENT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, #DDD6FE 0%, #C084FC 22%, #9333EA 50%, #6B21A8 76%, #3B0764 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

export const DpibBrandTitle: React.FC<DpibBrandTitleProps> = ({
  className = '',
  style = {},
}) => {
  return (
    <span
      className={`font-outfit font-black tracking-tight select-none drop-shadow-[0_1px_1px_rgba(59,7,100,0.18)] ${className}`}
      style={{
        ...VIOLET_GRADIENT_STYLE,
        ...style,
      }}
    >
      DPIB RESULT ZONE
    </span>
  );
};
