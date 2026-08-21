import React from 'react';

interface VertexSparkleIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const VertexSparkleIcon: React.FC<VertexSparkleIconProps> = ({
  className = 'w-5 h-5',
  size = 20,
  animated = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'animate-pulse' : ''}`}
    >
      <defs>
        <linearGradient id="vertex-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="80%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill="url(#vertex-sparkle-grad)"
      />
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
};
