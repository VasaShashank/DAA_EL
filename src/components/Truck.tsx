import React from 'react';
import { motion } from 'framer-motion';

interface TruckIconProps {
  x: number;
  y: number;
  loadPercentage: number;
  id?: string;
}

export const TruckIcon: React.FC<TruckIconProps> = ({ x, y, loadPercentage, id }) => {
  const loadColor = loadPercentage >= 90 ? '#f87171' : loadPercentage >= 60 ? '#fb923c' : '#4ade80';

  return (
    <motion.g
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{ duration: 0.4, ease: 'linear' }}
    >
      {/* Shadow */}
      <ellipse cx="0" cy="30" rx="34" ry="7" fill="#000" opacity="0.25" />

      {/* Truck Body */}
      <rect x="-35" y="-22" width="56" height="42" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />

      {/* Truck Cab */}
      <rect x="21" y="-12" width="22" height="32" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />

      {/* Windshield */}
      <rect x="24" y="-6" width="16" height="12" rx="3" fill="#38bdf8" opacity="0.4" />

      {/* Headlight */}
      <circle cx="40" cy="10" r="3.5" fill="#facc15" opacity="0.95" />

      {/* Load Fill Background */}
      <rect x="-30" y="-16" width="46" height="12" rx="3" fill="#0f172a" />
      {/* Load Fill */}
      <rect
        x="-30"
        y="-16"
        width={Math.max(0, 46 * (loadPercentage / 100))}
        height="12"
        rx="3"
        fill={loadColor}
        opacity="0.95"
      />
      {/* Load Text */}
      <text x="-7" y="-7" textAnchor="middle" fontSize="9" fontWeight="800" fontFamily="Inter" className="fill-white">
        {Math.round(loadPercentage)}%
      </text>

      {/* Wheels */}
      <circle cx="-20" cy="22" r="7.5" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
      <circle cx="-20" cy="22" r="3" fill="#475569" />
      <circle cx="10" cy="22" r="7.5" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
      <circle cx="10" cy="22" r="3" fill="#475569" />
      <circle cx="31" cy="22" r="7.5" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
      <circle cx="31" cy="22" r="3" fill="#475569" />

      {/* Truck ID Label */}
      {id && (
        <text x="-7" y="9" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="Inter" className="fill-accent-blue animate-pulse">
          {id.replace('truck-', 'T')}
        </text>
      )}
    </motion.g>
  );
};
