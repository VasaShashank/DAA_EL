import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSimulationStore } from '../store';
import { dijkstra } from '../utils/algorithms/dijkstra';
import type { NodeId } from '../types';
import type { DijkstraResult } from '../utils/algorithms/dijkstra';
import { PlaybackControls } from '../components/visualizers/PlaybackControls';
import { StatsPanel } from '../components/visualizers/StatsPanel';
import { PseudocodePanel } from '../components/visualizers/PseudocodePanel';
import { BinNode } from '../components/BinNode';
import { RoadEdge } from '../components/RoadEdge';
import { Route, MousePointer } from 'lucide-react';

const PSEUDOCODE = [
  'function Dijkstra(G, source, target):',
  '  dist[source] ← 0',
  '  for each v in V: dist[v] ← ∞',
  '  PQ ← MinHeap with source',
  '  while PQ is not empty:',
  '    u ← PQ.extractMin()',
  '    if u == target: return path',
  '    mark u as visited',
  '    for each neighbor v of u:',
  '      if dist[u]+w(u,v) < dist[v]:',
  '        dist[v] ← dist[u]+w(u,v)',
  '        prev[v] ← u',
  '        PQ.insert(v, dist[v])',
  '  reconstruct path from prev[]',
];

export const DijkstraVisualizer: React.FC = () => {
  const { nodes, edges, generateCity } = useSimulationStore();
  const [startNode, setStartNode] = useState<NodeId | null>(null);
  const [endNode, setEndNode] = useState<NodeId | null>(null);
  const [result, setResult] = useState<DijkstraResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectMode, setSelectMode] = useState<'start' | 'end'>('start');
  const playRef = useRef<number | null>(null);

  useEffect(() => { if (nodes.length === 0) generateCity(); }, [nodes.length, generateCity]);

  const runAlgorithm = useCallback(() => {
    if (startNode === null || endNode === null) return;
    const res = dijkstra(startNode, endNode, nodes, edges, true);
    setResult(res);
    setCurrentStep(0);
    setIsPlaying(false);
    useSimulationStore.getState().addAlgorithmRun({
      id: Math.random().toString(),
      timestamp: new Date(),
      stats: res.stats,
    });
  }, [startNode, endNode, nodes, edges]);

  // Playback
  useEffect(() => {
    if (isPlaying && result) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= result.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500 / speed);
      playRef.current = interval as unknown as number;
      return () => clearInterval(interval);
    }
  }, [isPlaying, result, speed]);

  const step = result?.steps[currentStep] || null;
  const pseudoLine = step ? (step.phase === 'select' ? 5 : step.phase === 'relax' ? 9 : 13) : -1;

  const handleNodeClick = (nodeId: NodeId) => {
    if (selectMode === 'start') {
      setStartNode(nodeId);
      setSelectMode('end');
    } else {
      setEndNode(nodeId);
      setSelectMode('start');
    }
    setResult(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold text-white">Dijkstra's Shortest Path</h2>
          <span className="text-xs text-dark-500 ml-2">O((V + E) log V)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${selectMode === 'start' ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' : 'text-dark-500'}`}>
              Start: {startNode !== null ? `Node ${startNode}` : 'Click node'}
            </span>
            <span className={`px-2 py-1 rounded ${selectMode === 'end' ? 'bg-accent-red/20 text-accent-red border border-accent-red/30' : 'text-dark-500'}`}>
              End: {endNode !== null ? `Node ${endNode}` : 'Click node'}
            </span>
          </div>
          <button onClick={runAlgorithm} className="btn-primary py-1.5" disabled={startNode === null || endNode === null}>
            Run Dijkstra
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-3">
          <div className="w-full h-full bg-dark-950 rounded-xl border border-dark-700/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-50" />
            {startNode === null && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-dark-800/90 backdrop-blur px-4 py-2 rounded-lg border border-dark-700/50 flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-accent-blue" />
                <span className="text-xs text-dark-500">Click a node to set <strong className="text-accent-green">start</strong>, then <strong className="text-accent-red">end</strong></span>
              </div>
            )}
            <svg viewBox="0 0 1200 900" className="w-full h-full relative z-10">
              {/* Edges */}
              {edges.map((edge, idx) => {
                const src = nodes.find(n => n.id === edge.source)!;
                const tgt = nodes.find(n => n.id === edge.target)!;
                const isRelaxing = step?.relaxingEdge?.source === edge.source && step?.relaxingEdge?.target === edge.target ||
                  step?.relaxingEdge?.source === edge.target && step?.relaxingEdge?.target === edge.source;
                const isInPath = result && step?.phase === 'done' && result.path.length > 1 &&
                  result.path.some((_n, i) => i < result.path.length - 1 &&
                    ((result.path[i] === edge.source && result.path[i+1] === edge.target) ||
                     (result.path[i] === edge.target && result.path[i+1] === edge.source)));

                return (
                  <RoadEdge key={idx} edge={edge} sourceNode={src} targetNode={tgt}
                    isRelaxing={isRelaxing || false} isPath={isInPath || false} />
                );
              })}

              {/* Nodes */}
              {nodes.map(node => (
                <BinNode key={node.id} node={node} size="large"
                  isDijkstraCurrent={step?.currentNode === node.id}
                  isDijkstraVisited={step?.visited?.has(node.id)}
                  isTSPSelected={node.id === startNode || node.id === endNode}
                  onClick={() => handleNodeClick(node.id)}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 shrink-0 glass-panel border-l border-dark-700/30 overflow-y-auto p-3 space-y-3">
          {result && (
            <PlaybackControls
              isPlaying={isPlaying} speed={speed}
              currentStep={currentStep} totalSteps={result.steps.length - 1}
              onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
              onStepForward={() => setCurrentStep(s => Math.min(s + 1, result.steps.length - 1))}
              onStepBackward={() => setCurrentStep(s => Math.max(s - 1, 0))}
              onReset={() => { setCurrentStep(0); setIsPlaying(false); }}
              onSpeedChange={setSpeed}
            />
          )}

          <StatsPanel stats={result?.stats || null} />

          {/* Priority Queue */}
          {step && step.priorityQueue.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="section-header">Priority Queue (Min Heap)</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {step.priorityQueue.slice(0, 10).map((item, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 px-2 rounded bg-dark-800/40">
                    <span className="text-dark-500">Node {item.id}</span>
                    <span className="text-accent-blue font-mono">{item.distance === Infinity ? '∞' : item.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Path */}
          {result && step?.phase === 'done' && (
            <div className="glass-card p-4">
              <h3 className="section-header text-accent-green">Shortest Path Found</h3>
              <div className="bg-dark-800/40 rounded-lg p-3 text-xs font-mono text-accent-green">
                {result.path.join(' → ')}
              </div>
              <p className="text-xs text-dark-500 mt-2">Total Distance: <span className="text-white font-semibold">{result.distance}</span></p>
            </div>
          )}

          <PseudocodePanel title="Pseudocode" lines={PSEUDOCODE} highlightedLine={pseudoLine} />
        </div>
      </div>
    </div>
  );
};

export default DijkstraVisualizer;
