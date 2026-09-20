// Nokia-inspired branding — isolated component (can be restyled independently)
import React from 'react';

interface Props {
  className?: string;
}

const NokiaBranding: React.FC<Props> = ({ className = '' }) => (
  <div
    className={`nokia-brand ${className}`}
    role="img"
    aria-label="Nokia"
  >
    NOKIA
  </div>
);

export default NokiaBranding;
