import React from 'react';
import type { Node, Edge } from '../types';

interface RoadEdgeProps {
  edge: Edge;
  sourceNode: Node;
  targetNode: Node;
  isRelaxing?: boolean;
  isTSPRoute?: boolean;
  isPath?: boolean;
}

export const RoadEdge: React.FC<RoadEdgeProps> = ({
  edge,
  sourceNode,
  targetNode,
  isRelaxing,
  isTSPRoute,
  isPath,
}) => {
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;

  // Blocked road
  if (edge.isBlocked) {
    return (
      <g>
        <line
          x1={sourceNode.x} y1={sourceNode.y}
          x2={targetNode.x} y2={targetNode.y}
          stroke="#f87171" strokeWidth="3" opacity="0.6"
          strokeDasharray="8 6"
        />
        {/* X mark at midpoint */}
        <text x={midX} y={midY + 4} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#f87171">✕</text>
      </g>
    );
  }

  // Traffic-based color
  let strokeColor = '#3b4f68';
  let strokeWidth = 3.5;
  let opacity = 0.5;

  // Color by traffic weight for default edges
  if (edge.trafficWeight > 6) {
    strokeColor = '#b91c1c';
    opacity = 0.7;
    strokeWidth = 4;
  } else if (edge.trafficWeight > 3) {
    strokeColor = '#d97706';
    opacity = 0.6;
    strokeWidth = 3.8;
  }

  if (isRelaxing) {
    strokeColor = '#fb923c';
    strokeWidth = 6;
    opacity = 1;
  } else if (isTSPRoute) {
    strokeColor = '#a78bfa';
    strokeWidth = 6.5;
    opacity = 1;
  } else if (isPath) {
    strokeColor = '#38bdf8';
    strokeWidth = 5.5;
    opacity = 1;
  }

  const showLabel = true;

  return (
    <g>
      {/* Glow for active paths */}
      {(isPath || isTSPRoute || isRelaxing) && (
        <line
          x1={sourceNode.x} y1={sourceNode.y}
          x2={targetNode.x} y2={targetNode.y}
          stroke={strokeColor} strokeWidth={strokeWidth + 6} opacity={0.25}
          strokeLinecap="round"
        />
      )}

      {/* Main Edge */}
      <line
        x1={sourceNode.x} y1={sourceNode.y}
        x2={targetNode.x} y2={targetNode.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        strokeLinecap="round"
        className="transition-all duration-300"
      />

      {/* Distance Label - show for all edges */}
      {showLabel && (
        <>
          <rect
            x={midX - 18} y={midY - 12}
            width="36" height="24" rx="6"
            fill="#0f172a" stroke={strokeColor} strokeWidth="2" opacity="0.95"
          />
          <text x={midX} y={midY + 5} textAnchor="middle"
            fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono" fill={isPath || isTSPRoute || isRelaxing ? '#ffffff' : '#94a3b8'}>
            {edge.distance}
          </text>
        </>
      )}
    </g>
  );
};
