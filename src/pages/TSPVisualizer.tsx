import React, { useState, useEffect, useCallback } from 'react';
import { useSimulationStore } from '../store';
import { branchAndBoundTSP, nearestNeighborTSP } from '../utils/algorithms/branchAndBound';
import { buildDistanceMatrix } from '../utils/algorithms/dijkstra';
import type { NodeId, BranchAndBoundNode, AlgorithmStats } from '../types';
import { PlaybackControls } from '../components/visualizers/PlaybackControls';
import { StatsPanel } from '../components/visualizers/StatsPanel';
import { PseudocodePanel } from '../components/visualizers/PseudocodePanel';
import { BinNode } from '../components/BinNode';
import { RoadEdge } from '../components/RoadEdge';
import { GitBranch, MousePointer } from 'lucide-react';

const PSEUDOCODE = [
  'function BranchAndBound_TSP(G, depot):',
  '  bestCost ← ∞, bestRoute ← ∅',
  '  PQ ← {root: path=[depot], cost=0}',
  '  while PQ is not empty:',
  '    node ← PQ.extractMin()',
  '    if node.LB ≥ bestCost: PRUNE',
  '    if all cities visited:',
  '      totalCost ← cost + return_to_depot',
  '      if totalCost < bestCost:',
  '        bestCost ← totalCost',
  '        bestRoute ← node.path',
  '    else:',
  '      for each unvisited city c:',
  '        child ← expand(node, c)',
  '        child.LB ← lowerBound(child)',
  '        if child.LB < bestCost:',
  '          PQ.insert(child)',
  '  return bestRoute',
];

export const TSPVisualizer: React.FC = () => {
  const { nodes, edges, generateCity } = useSimulationStore();
  const [selectedBins, setSelectedBins] = useState<NodeId[]>([]);
  const [stateTree, setStateTree] = useState<BranchAndBoundNode[]>([]);
  const [optimalRoute, setOptimalRoute] = useState<NodeId[]>([]);
  const [stats, setStats] = useState<AlgorithmStats | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [usedBB, setUsedBB] = useState(true);

  useEffect(() => { if (nodes.length === 0) generateCity(); }, [nodes.length, generateCity]);

  const toggleBin = (id: NodeId) => {
    if (nodes.find(n => n.id === id)?.isDepot) return;
    setSelectedBins(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
    setStateTree([]);
    setOptimalRoute([]);
    setStats(null);
  };

  const runAlgorithm = useCallback(() => {
    if (selectedBins.length === 0) return;
    const distMatrix = buildDistanceMatrix([0, ...selectedBins], nodes, edges);

    if (selectedBins.length <= 8) {
      const result = branchAndBoundTSP(0, selectedBins, distMatrix);
      setStateTree(result.stateTree);
      setOptimalRoute(result.optimalRoute);
      setStats(result.stats);
      setVisibleNodes(0);
      setCurrentStep(0);
      setUsedBB(true);
    } else {
      const result = nearestNeighborTSP(0, selectedBins, distMatrix);
      setOptimalRoute(result.route);
      setStats(result.stats);
      setStateTree([]);
      setUsedBB(false);
    }

    const runStats = selectedBins.length <= 8
      ? branchAndBoundTSP(0, selectedBins, distMatrix).stats
      : nearestNeighborTSP(0, selectedBins, distMatrix).stats;

    useSimulationStore.getState().addAlgorithmRun({
      id: Math.random().toString(),
      timestamp: new Date(),
      stats: runStats,
    });
  }, [selectedBins, nodes, edges]);

  // Playback for state tree animation
  useEffect(() => {
    if (isPlaying && stateTree.length > 0) {
      const interval = setInterval(() => {
        setVisibleNodes(prev => {
          if (prev >= stateTree.length) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
        setCurrentStep(prev => prev + 1);
      }, 400 / speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, stateTree, speed]);

  // Render state space tree
  const renderStateTree = () => {
    if (stateTree.length === 0) return null;
    const visible = stateTree.slice(0, visibleNodes);
    const maxLevel = Math.max(...visible.map(n => n.level), 0);
    const levelCounts: Record<number, number> = {};
    const levelPositions: Record<number, number> = {};

    visible.forEach(n => {
      levelCounts[n.level] = (levelCounts[n.level] || 0) + 1;
      levelPositions[n.level] = 0;
    });

    const treeWidth = 700;
    const treeHeight = 300;
    const levelHeight = maxLevel > 0 ? treeHeight / (maxLevel + 1) : treeHeight;

    const nodePositions = new Map<number, { x: number; y: number }>();

    visible.forEach(n => {
      const count = levelCounts[n.level] || 1;
      const idx = levelPositions[n.level]++;
      const x = (treeWidth / (count + 1)) * (idx + 1);
      const y = 30 + n.level * Math.min(levelHeight, 60);
      nodePositions.set(n.id, { x, y });
    });

    return (
      <svg viewBox={`0 0 ${treeWidth} ${Math.min(treeHeight, (maxLevel + 1) * 60 + 60)}`}
        className="w-full" style={{ minHeight: 200 }}>
        {/* Edges */}
        {visible.map(n => {
          if (n.parentId === null) return null;
          const parent = nodePositions.get(n.parentId);
          const child = nodePositions.get(n.id);
          if (!parent || !child) return null;
          return (
            <line key={`e-${n.id}`} x1={parent.x} y1={parent.y} x2={child.x} y2={child.y}
              stroke={n.isPruned ? '#7f1d1d' : n.isOptimal ? '#4ade80' : '#334155'}
              strokeWidth={n.isOptimal ? 2 : 1} opacity={n.isPruned ? 0.4 : 0.7} />
          );
        })}
        {/* Nodes */}
        {visible.map(n => {
          const pos = nodePositions.get(n.id);
          if (!pos) return null;
          const color = n.isPruned ? '#f87171' : n.isOptimal ? '#4ade80' : '#38bdf8';
          return (
            <g key={n.id} transform={`translate(${pos.x},${pos.y})`}>
              <circle r="14" fill={n.isPruned ? '#7f1d1d' : n.isOptimal ? '#14532d' : '#0c4a6e'}
                stroke={color} strokeWidth="2" />
              <text y="4" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
                {n.cost === Infinity ? '∞' : Math.round(n.cost)}
              </text>
              <text y="24" textAnchor="middle" fontSize="7" fill="#64748b">
                LB:{n.lowerBound === Infinity ? '∞' : Math.round(n.lowerBound)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const isEdgeInRoute = (src: number, tgt: number) => {
    for (let i = 0; i < optimalRoute.length - 1; i++) {
      if ((optimalRoute[i] === src && optimalRoute[i+1] === tgt) || (optimalRoute[i] === tgt && optimalRoute[i+1] === src))
        return true;
    }
    return false;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-accent-purple" />
          <h2 className="text-sm font-semibold text-white">TSP — Branch & Bound</h2>
          <span className="text-xs text-dark-500 ml-2">
            Selected: {selectedBins.length} bins {selectedBins.length > 8 ? '(→ Nearest Neighbor)' : '(→ B&B)'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedBins([])} className="btn-ghost text-xs py-1.5">Clear</button>
          <button onClick={() => {
            const bins = nodes.filter(n => !n.isDepot).slice(0, 6).map(n => n.id);
            setSelectedBins(bins);
          }} className="btn-ghost text-xs py-1.5">Auto Select 6</button>
          <button onClick={runAlgorithm} className="btn-primary py-1.5" disabled={selectedBins.length === 0}>
            Run TSP
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-3">
          <div className="w-full h-full bg-dark-950 rounded-xl border border-dark-700/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-50" />
            {selectedBins.length === 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-dark-800/90 backdrop-blur px-4 py-2 rounded-lg border border-dark-700/50 flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-accent-purple" />
                <span className="text-xs text-dark-500">Click bins to select destinations (≤8 for Branch & Bound)</span>
              </div>
            )}
            <svg viewBox="0 0 1200 900" className="w-full h-full relative z-10">
              {edges.map((edge, idx) => {
                const src = nodes.find(n => n.id === edge.source)!;
                const tgt = nodes.find(n => n.id === edge.target)!;
                return (
                  <RoadEdge key={idx} edge={edge} sourceNode={src} targetNode={tgt}
                    isTSPRoute={optimalRoute.length > 0 && isEdgeInRoute(edge.source, edge.target)} />
                );
              })}
              {nodes.map(node => (
                <BinNode key={node.id} node={node} size="large"
                  isTSPSelected={selectedBins.includes(node.id)}
                  onClick={() => toggleBin(node.id)} />
              ))}
            </svg>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 shrink-0 glass-panel border-l border-dark-700/30 overflow-y-auto p-3 space-y-3">
          {stateTree.length > 0 && (
            <PlaybackControls
              isPlaying={isPlaying} speed={speed}
              currentStep={visibleNodes} totalSteps={stateTree.length}
              onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
              onStepForward={() => setVisibleNodes(s => Math.min(s + 1, stateTree.length))}
              onStepBackward={() => setVisibleNodes(s => Math.max(s - 1, 0))}
              onReset={() => { setVisibleNodes(0); setIsPlaying(false); }}
              onSpeedChange={setSpeed}
            />
          )}

          <StatsPanel stats={stats} />

          {/* State Space Tree */}
          {stateTree.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="section-header">State Space Tree</h3>
              <div className="bg-dark-950/60 rounded-lg p-2 border border-dark-700/30 overflow-x-auto">
                {renderStateTree()}
              </div>
              <div className="flex gap-3 mt-2 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-blue" /> Explored</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-green" /> Optimal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-red" /> Pruned</span>
              </div>
            </div>
          )}

          {/* Optimal Route */}
          {optimalRoute.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="section-header text-accent-green">
                {usedBB ? 'Optimal' : 'Heuristic'} Route
              </h3>
              <div className="bg-dark-800/40 rounded-lg p-3 text-xs font-mono text-accent-purple">
                {optimalRoute.join(' → ')}
              </div>
            </div>
          )}

          <PseudocodePanel title="B&B Pseudocode" lines={PSEUDOCODE} highlightedLine={currentStep % PSEUDOCODE.length} />
        </div>
      </div>
    </div>
  );
};

export default TSPVisualizer;
