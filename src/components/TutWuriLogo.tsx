import React, { useState } from 'react';
import tutWuriImg from '../assets/images/logo_tut_wuri_1790606694726.jpg';

interface TutWuriLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TutWuriLogo: React.FC<TutWuriLogoProps> = ({ size = 'lg', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    sm: 'w-11 h-11 p-1 rounded-xl',
    md: 'w-16 h-16 p-1.5 rounded-2xl',
    lg: 'w-28 h-28 p-2 rounded-2xl'
  }[size];

  return (
    <div
      className={`bg-white shadow-md border border-blue-200 flex items-center justify-center overflow-hidden shrink-0 ${dimensions} ${className}`}
      title="Logo Resmi Pendidikan Indonesia - Tut Wuri Handayani"
    >
      {!imgError ? (
        <img
          src={tutWuriImg}
          alt="Logo Resmi Pendidikan Indonesia Tut Wuri Handayani Segi Lima Biru"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      ) : (
        <svg viewBox="0 0 220 220" className="w-full h-full" aria-label="Tut Wuri Handayani">
          <polygon
            points="110,12 204,76 168,194 52,194 16,76"
            fill="#1d4ed8"
            stroke="#1e3a8a"
            strokeWidth="5"
          />
          <path
            id="curveText"
            d="M 42,82 A 72,72 0 0,1 178,82"
            fill="transparent"
          />
          <text fill="#ffffff" fontSize="12.5" fontWeight="800" letterSpacing="1">
            <textPath href="#curveText" startOffset="50%" textAnchor="middle">
              TUT WURI HANDAYANI
            </textPath>
          </text>
          {/* Garuda Wings */}
          <path
            d="M45,108 Q80,82 110,104 Q140,82 175,108 Q152,138 110,136 Q68,138 45,108 Z"
            fill="#ffffff"
          />
          {/* Blencong Yellow Flame Lamp */}
          <circle cx="110" cy="102" r="16" fill="#facc15" />
          <path d="M110,74 L117,95 L103,95 Z" fill="#fef08a" />
          {/* Open Book */}
          <path
            d="M68,148 L108,154 L108,176 L68,170 Z M152,148 L112,154 L112,176 L152,170 Z"
            fill="#ffffff"
          />
        </svg>
      )}
    </div>
  );
};
