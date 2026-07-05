import React from 'react';
import type { Node } from '../types';
import { motion } from 'framer-motion';
import { isPredictedOverflow } from '../utils/algorithms';

interface BinNodeProps {
  node: Node;
  isDijkstraCurrent?: boolean;
  isDijkstraVisited?: boolean;
  isTSPSelected?: boolean;
  isBlocked?: boolean;
  onClick?: () => void;
  size?: 'normal' | 'large';
}

export const BinNode: React.FC<BinNodeProps> = ({
  node,
  isDijkstraCurrent,
  isDijkstraVisited,
  isTSPSelected,
  onClick,
  size = 'normal',
}) => {
  const predictedOverflow = isPredictedOverflow(node);
  const r = size === 'large' ? 38 : 32;

  // Determine colors based on fill level
  let fillColor = '#4ade80'; // Green
  let bgFill = '#14532d';
  if (node.fillLevel >= 80) { fillColor = '#f87171'; bgFill = '#7f1d1d'; }
  else if (node.fillLevel >= 50) { fillColor = '#facc15'; bgFill = '#713f12'; }

  // Override for algorithm states
  if (isDijkstraCurrent) { fillColor = '#38bdf8'; bgFill = '#0c4a6e'; }
  else if (isDijkstraVisited) { fillColor = '#22d3ee'; bgFill = '#164e63'; }
  else if (isTSPSelected) { fillColor = '#a78bfa'; bgFill = '#4c1d95'; }

  const isFull = node.fillLevel >= 100;

  if (node.isDepot) {
    const dr = r + 6;
    return (
      <g transform={`translate(${node.x}, ${node.y})`}>
        {/* Glow */}
        <motion.circle
          r={dr + 8}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1"
          opacity={0.3}
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />
        {/* Base */}
        <rect x={-dr} y={-dr} width={dr * 2} height={dr * 2} rx="10"
          fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
        {/* Depot Icon */}
        <path d={`M${-dr/2},${-dr/4} L0,${-dr/1.5} L${dr/2},${-dr/4} L${dr/2},${dr/3} L${-dr/2},${dr/3} Z`}
          fill="#38bdf8" opacity="0.8" />
        <rect x={-dr/6} y={-dr/8} width={dr/3} height={dr/2.5} rx="2" fill="#0f172a" />
        {/* Label */}
        <text y={dr + 16} textAnchor="middle" className="fill-accent-blue" fontSize="11" fontWeight="700" fontFamily="Inter">
          DEPOT
        </text>
      </g>
    );
  }

  return (
    <g transform={`translate(${node.x}, ${node.y})`} onClick={onClick} className="cursor-pointer">
      {/* Overflow Prediction Halo */}
      {predictedOverflow && !isFull && (
        <motion.circle
          r={r + 8}
          fill="none"
          stroke="#fb923c"
          strokeWidth="2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* Full Flashing Halo */}
      {isFull && (
        <motion.circle
          r={r + 10}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      {/* Outer Glow Ring */}
      <circle r={r + 2} fill="none" stroke={fillColor} strokeWidth="1" opacity="0.3" />

      {/* Background Circle */}
      <motion.circle
        r={r}
        fill={isFull ? bgFill : '#0f172a'}
        stroke={fillColor}
        strokeWidth="3"
        initial={false}
        animate={{
          fill: isFull ? bgFill : '#0f172a',
          strokeWidth: isDijkstraCurrent ? 4 : 3,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Fill Level Arc */}
      {!isFull && node.fillLevel > 0 && (
        <circle
          r={r - 4}
          fill="none"
          stroke={fillColor}
          strokeWidth="3"
          strokeDasharray={`${(node.fillLevel / 100) * (2 * Math.PI * (r - 4))} ${2 * Math.PI * (r - 4)}`}
          strokeDashoffset={2 * Math.PI * (r - 4) * 0.25}
          opacity="0.3"
          strokeLinecap="round"
        />
      )}

      {/* Fill Level Text */}
      <text y="1" textAnchor="middle" fontSize={r > 24 ? "12" : "10"} fontWeight="700"
        fontFamily="Inter" className="fill-white" style={{ pointerEvents: 'none' }}>
        {Math.floor(node.fillLevel)}%
      </text>

      {/* Node ID */}
      <text y={r + 14} textAnchor="middle" fontSize="10" fontWeight="500"
        fontFamily="Inter" className="fill-dark-500">
        Bin {node.id}
      </text>

      {/* Special indicators */}
      {node.nearHospital && (
        <circle cx={r - 2} cy={-r + 2} r="4" fill="#f87171" stroke="#0f172a" strokeWidth="1.5" />
      )}
      {node.nearSchool && (
        <circle cx={-r + 2} cy={-r + 2} r="4" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />
      )}
    </g>
  );
};
