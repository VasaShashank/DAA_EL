import React, { useState, useEffect, useCallback } from 'react';
import { useSimulationStore } from '../store';
import { traverseDecisionTree, getDecisionTreeNodes } from '../utils/algorithms/decisionTree';
import type { DecisionTreeResult, DecisionTreeNode } from '../types';
import { TreeDeciduous, Play } from 'lucide-react';

export const DecisionTreePage: React.FC = () => {
  const { nodes, generateCity } = useSimulationStore();
  const [destinationCount, setDestinationCount] = useState(5);
  const [truckFull, setTruckFull] = useState(false);
  const [highTraffic, setHighTraffic] = useState(false);
  const [result, setResult] = useState<DecisionTreeResult | null>(null);
  const [animatedPath, setAnimatedPath] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const treeNodes = getDecisionTreeNodes();

  useEffect(() => { if (nodes.length === 0) generateCity(); }, [nodes.length, generateCity]);

  const runTraversal = useCallback(() => {
    const res = traverseDecisionTree({
      truckFull,
      destinationCount,
      hasHighTraffic: highTraffic,
      hasRoadFailures: false,
    });
    setResult(res);
    setAnimatedPath([]);
    setIsAnimating(true);

    // Animate traversal
    res.traversalPath.forEach((nodeId, idx) => {
      setTimeout(() => {
        setAnimatedPath(prev => [...prev, nodeId]);
        if (idx === res.traversalPath.length - 1) setIsAnimating(false);
      }, (idx + 1) * 600);
    });
  }, [truckFull, destinationCount, highTraffic]);

  // Layout decision tree as a top-down tree
  const renderDecisionTree = () => {
    const nodeMap = new Map<string, DecisionTreeNode>(treeNodes.map(n => [n.id, n]));
    const positions = new Map<string, { x: number; y: number }>();

    // BFS layout
    const queue: { id: string; level: number; col: number }[] = [{ id: 'root', level: 0, col: 7.5 }];
    let idx = 0;
    const levelWidths: Record<number, number> = {};

    while (idx < queue.length) {
      const curr = queue[idx++];
      const node = nodeMap.get(curr.id);
      if (!node) continue;
      positions.set(curr.id, { x: 50 + curr.col * 95, y: 40 + curr.level * 95 });
      levelWidths[curr.level] = (levelWidths[curr.level] || 0) + 1;

      const spread = Math.max(1, 3.2 - curr.level * 1.1);
      if (node.yesChild) queue.push({ id: node.yesChild, level: curr.level + 1, col: curr.col - spread });
      if (node.noChild) queue.push({ id: node.noChild, level: curr.level + 1, col: curr.col + spread });
    }

    const maxLevel = Math.max(...Object.keys(levelWidths).map(Number), 0);

    return (
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
        <svg viewBox={`0 0 1600 ${(maxLevel + 1) * 95 + 60}`} className="h-auto min-w-[1550px] relative z-10 mx-auto">
        {/* Edges */}
        {treeNodes.map(node => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          return [
            node.yesChild && positions.get(node.yesChild) && (
              <g key={`e-${node.id}-yes`}>
                <line x1={pos.x} y1={pos.y + 20} x2={positions.get(node.yesChild)!.x} y2={positions.get(node.yesChild)!.y - 20}
                  stroke={animatedPath.includes(node.yesChild) ? '#4ade80' : '#334155'}
                  strokeWidth={animatedPath.includes(node.yesChild) ? 2.5 : 1} />
                <text x={(pos.x + positions.get(node.yesChild)!.x) / 2 - 10}
                  y={(pos.y + positions.get(node.yesChild)!.y) / 2}
                  fontSize="9" fill="#4ade80" fontWeight="bold">Yes</text>
              </g>
            ),
            node.noChild && positions.get(node.noChild) && (
              <g key={`e-${node.id}-no`}>
                <line x1={pos.x} y1={pos.y + 20} x2={positions.get(node.noChild)!.x} y2={positions.get(node.noChild)!.y - 20}
                  stroke={animatedPath.includes(node.noChild) ? '#f87171' : '#334155'}
                  strokeWidth={animatedPath.includes(node.noChild) ? 2.5 : 1} />
                <text x={(pos.x + positions.get(node.noChild)!.x) / 2 + 5}
                  y={(pos.y + positions.get(node.noChild)!.y) / 2}
                  fontSize="9" fill="#f87171" fontWeight="bold">No</text>
              </g>
            ),
          ];
        })}

        {/* Nodes */}
        {treeNodes.map(node => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const isOnPath = animatedPath.includes(node.id);
          const isLeaf = node.result !== null && node.yesChild === null;
          const isResult = result && result.traversalPath[result.traversalPath.length - 1] === node.id;

          return (
            <g key={node.id} transform={`translate(${pos.x},${pos.y})`}>
              {isLeaf ? (
                <>
                  <rect x="-55" y="-18" width="110" height="36" rx="8"
                    fill={isOnPath ? (isResult ? '#14532d' : '#0c4a6e') : '#1e293b'}
                    stroke={isResult ? '#4ade80' : isOnPath ? '#38bdf8' : '#334155'}
                    strokeWidth={isOnPath ? 2.5 : 1.5}
                    className="transition-all duration-300" />
                  <text y="5" textAnchor="middle" fontSize="9" fontWeight="700"
                    fill={isResult ? '#4ade80' : isOnPath ? '#38bdf8' : 'white'} fontFamily="Inter">
                    {node.result}
                  </text>
                </>
              ) : (
                <>
                  <rect x="-55" y="-18" width="110" height="36" rx="18"
                    fill={isOnPath ? '#4c1d95' : '#1e293b'}
                    stroke={isOnPath ? '#a78bfa' : '#334155'}
                    strokeWidth={isOnPath ? 2.5 : 1.5}
                    className="transition-all duration-300" />
                  <text y="5" textAnchor="middle" fontSize="9" fontWeight="600"
                    fill={isOnPath ? '#a78bfa' : '#94a3b8'} fontFamily="Inter">
                    {node.condition}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="w-4 h-4 text-accent-purple" />
          <h2 className="text-sm font-semibold text-white">Decision Tree — Algorithm Selector</h2>
        </div>
        <button onClick={runTraversal} className="btn-primary py-1.5 flex items-center gap-1" disabled={isAnimating}>
          <Play className="w-3.5 h-3.5" /> Traverse
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Center: Tree */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="glass-card p-4 mb-3">
            <h3 className="section-header">Decision Tree Visualization</h3>
            <div className="bg-dark-950/60 rounded-lg p-2 border border-dark-700/30 overflow-x-auto">
              {renderDecisionTree()}
            </div>
            <div className="flex gap-4 mt-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-accent-purple bg-dark-800" /> Decision</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-accent-blue bg-dark-800" /> Algorithm</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-accent-green bg-dark-800" /> Selected</span>
            </div>
          </div>

          {/* Traversal Log */}
          {result && (
            <div className="glass-card p-4">
              <h3 className="section-header text-accent-green">Traversal Decisions</h3>
              <div className="space-y-2">
                {result.decisions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs bg-dark-800/40 rounded-lg p-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      d.result ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
                    }`}>
                      {d.result ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{d.condition}</p>
                      <p className="text-dark-500">{d.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Controls + Result */}
        <div className="w-80 shrink-0 glass-panel border-l border-dark-700/30 overflow-y-auto p-3 space-y-3">
          {/* Input Controls */}
          <div className="glass-card p-4">
            <h3 className="section-header">Simulation Parameters</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-xs text-dark-500">Destinations</span>
                <input type="number" min={1} max={20} value={destinationCount}
                  onChange={e => setDestinationCount(parseInt(e.target.value) || 1)}
                  className="w-16 bg-dark-800/60 rounded px-2 py-1 text-sm text-white font-mono text-center border border-dark-700/30 outline-none" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-xs text-dark-500">Truck Full?</span>
                <button onClick={() => setTruckFull(!truckFull)}
                  className={`w-10 h-5 rounded-full transition-all ${truckFull ? 'bg-accent-green' : 'bg-dark-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${truckFull ? 'ml-5' : 'ml-0.5'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-xs text-dark-500">High Traffic?</span>
                <button onClick={() => setHighTraffic(!highTraffic)}
                  className={`w-10 h-5 rounded-full transition-all ${highTraffic ? 'bg-accent-orange' : 'bg-dark-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${highTraffic ? 'ml-5' : 'ml-0.5'}`} />
                </button>
              </label>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="glass-card p-4 glow-green">
              <h3 className="section-header text-accent-green">Selected Algorithm</h3>
              <div className="bg-dark-800/40 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-white">{result.chosenAlgorithm}</p>
                <p className="text-xs text-dark-500 mt-1">{result.reason}</p>
                <div className="mt-3 inline-block bg-accent-purple/20 px-3 py-1 rounded-full">
                  <span className="text-xs text-accent-purple font-mono">{result.expectedComplexity}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionTreePage;
