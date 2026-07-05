import React from 'react';
import { useSimulationStore } from '../store';
import { BinNode } from './BinNode';
import { RoadEdge } from './RoadEdge';
import { TruckIcon } from './Truck';

export const CityMap: React.FC = () => {
  const { nodes, edges, trucks, activeMode, dijkstraState, tspState, triggerEmergency } = useSimulationStore();
  const viewBox = '0 0 1200 900';

  if (nodes.length === 0) return null;

  const isEdgeInRoute = (source: number, target: number, route: number[]) => {
    for (let i = 0; i < route.length - 1; i++) {
      if ((route[i] === source && route[i + 1] === target) || (route[i] === target && route[i + 1] === source)) {
        return true;
      }
    }
    return false;
  };

  const isDijkstraRelaxing = (source: number, target: number) => {
    if (!dijkstraState) return false;
    return dijkstraState.relaxingEdges.some(e =>
      (e.source === source && e.target === target) || (e.source === target && e.target === source)
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-dark-950 rounded-xl border border-dark-700/30 shadow-2xl">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />

      <svg viewBox={viewBox} className="w-full h-full relative z-10" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Render Edges */}
        {edges.map((edge, idx) => {
          const sourceNode = nodes.find(n => n.id === edge.source)!;
          const targetNode = nodes.find(n => n.id === edge.target)!;

          let isPath = false;
          let isTSP = false;

          if (activeMode === 'TSP' && tspState) {
            isTSP = isEdgeInRoute(edge.source, edge.target, tspState.currentBestRoute);
          } else {
            isPath = trucks.some(t => isEdgeInRoute(edge.source, edge.target, t.path));
          }

          return (
            <RoadEdge
              key={`edge-${idx}`}
              edge={edge}
              sourceNode={sourceNode}
              targetNode={targetNode}
              isRelaxing={activeMode === 'DIJKSTRA' && isDijkstraRelaxing(edge.source, edge.target)}
              isTSPRoute={isTSP}
              isPath={isPath}
            />
          );
        })}

        {/* Render Nodes */}
        {nodes.map(node => (
          <BinNode
            key={`node-${node.id}`}
            node={node}
            isDijkstraCurrent={activeMode === 'DIJKSTRA' && dijkstraState?.currentNode === node.id}
            isDijkstraVisited={activeMode === 'DIJKSTRA' && (dijkstraState?.visited?.has(node.id) || false)}
            isTSPSelected={activeMode === 'TSP' && (tspState?.selectedBins?.includes(node.id) || false)}
            size="large"
            onClick={() => {
              if (activeMode === 'MAIN') {
                triggerEmergency(node.id);
              }
            }}
          />
        ))}

        {/* Render Trucks */}
        {trucks.map(truck => {
          let tx = 0, ty = 0;
          if (truck.targetNode !== null && truck.currentNode !== null) {
            const startNode = nodes.find(n => n.id === truck.currentNode)!;
            const endNode = nodes.find(n => n.id === truck.targetNode)!;
            tx = startNode.x + (endNode.x - startNode.x) * truck.progress;
            ty = startNode.y + (endNode.y - startNode.y) * truck.progress;
          } else if (truck.currentNode !== null) {
            const node = nodes.find(n => n.id === truck.currentNode)!;
            tx = node.x;
            ty = node.y;
          } else {
            return null;
          }

          return (
            <TruckIcon
              key={truck.id}
              x={tx}
              y={ty}
              loadPercentage={(truck.currentLoad / truck.capacity) * 100}
              id={truck.id}
            />
          );
        })}
      </svg>
    </div>
  );
};
