import React, { useState, useEffect, useCallback } from 'react';
import { useSimulationStore } from '../store';
import { MaxHeap, calculateHeapPriority } from '../utils/algorithms/heap';
import type { HeapStep } from '../types';
import type { HeapItem } from '../utils/algorithms/heap';
import { PlaybackControls } from '../components/visualizers/PlaybackControls';
import { PseudocodePanel } from '../components/visualizers/PseudocodePanel';
import { Binary, Plus, ArrowUp, RotateCcw } from 'lucide-react';

const PSEUDOCODE = [
  'class MaxHeap:',
  '  insert(item):',
  '    heap.append(item)',
  '    bubbleUp(heap.size - 1)',
  '',
  '  extractMax():',
  '    max ← heap[0]',
  '    heap[0] ← heap.pop()',
  '    sinkDown(0)',
  '    return max',
  '',
  '  bubbleUp(i):',
  '    while i > 0 and heap[i] > heap[parent(i)]:',
  '      swap(heap[i], heap[parent(i)])',
  '      i ← parent(i)',
  '',
  '  sinkDown(i):',
  '    while hasChild(i):',
  '      largest ← max(left, right, i)',
  '      if largest ≠ i: swap and continue',
  '      else: break',
];

export const HeapVisualizer: React.FC = () => {
  const { nodes, generateCity } = useSimulationStore();
  const [, setHeap] = useState<MaxHeap>(new MaxHeap(true));
  const [heapItems, setHeapItems] = useState<HeapItem[]>([]);
  const [steps, setSteps] = useState<HeapStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => { if (nodes.length === 0) generateCity(); }, [nodes.length, generateCity]);

  const buildFromBins = useCallback(() => {
    const h = new MaxHeap(true);
    const items: HeapItem[] = nodes.filter(n => !n.isDepot).map(n => ({
      binId: n.id,
      priority: calculateHeapPriority(n),
      label: `Bin ${n.id}`,
    }));
    h.buildHeap(items);
    setHeap(h);
    setHeapItems(h.getArray());
    setSteps(h.steps);
    setCurrentStep(0);
  }, [nodes]);

  const insertRandom = useCallback(() => {
    const h = new MaxHeap(true);
    h.heap = [...heapItems];
    const newItem: HeapItem = {
      binId: Math.floor(Math.random() * 100) + 50,
      priority: Math.round(Math.random() * 100),
      label: `New ${Math.floor(Math.random() * 100)}`,
    };
    h.insert(newItem);
    setHeap(h);
    setHeapItems(h.getArray());
    setSteps(prev => [...prev, ...h.steps]);
  }, [heapItems]);

  const extractMax = useCallback(() => {
    const h = new MaxHeap(true);
    h.heap = [...heapItems];
    if (h.size === 0) return;
    h.extractMax();
    setHeap(h);
    setHeapItems(h.getArray());
    setSteps(prev => [...prev, ...h.steps]);
  }, [heapItems]);

  // Playback
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 600 / speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, steps, speed]);

  const currentStepData = steps[currentStep] || null;
  const displayArray = currentStepData?.array || heapItems.map(h => h.priority);
  const highlightIndices = currentStepData?.indices || [];

  // Render heap as tree
  const renderTree = () => {
    if (displayArray.length === 0) return <p className="text-xs text-dark-500 text-center py-8">Heap is empty</p>;

    const width = 700;
    const positions: { x: number; y: number }[] = [];
    const levels = Math.ceil(Math.log2(displayArray.length + 1));
    const levelHeight = 55;

    for (let i = 0; i < displayArray.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const posInLevel = i - (Math.pow(2, level) - 1);
      const nodesInLevel = Math.pow(2, level);
      const spacing = width / (nodesInLevel + 1);
      positions.push({
        x: spacing * (posInLevel + 1),
        y: 35 + level * levelHeight,
      });
    }

    return (
      <svg viewBox={`0 0 ${width} ${levels * levelHeight + 50}`} className="w-full" style={{ minHeight: 200 }}>
        {/* Edges */}
        {displayArray.map((_, i) => {
          if (i === 0) return null;
          const parent = Math.floor((i - 1) / 2);
          return (
            <line key={`e-${i}`}
              x1={positions[parent].x} y1={positions[parent].y}
              x2={positions[i].x} y2={positions[i].y}
              stroke={highlightIndices.includes(i) || highlightIndices.includes(parent) ? '#38bdf8' : '#334155'}
              strokeWidth={highlightIndices.includes(i) ? 2 : 1}
            />
          );
        })}
        {/* Nodes */}
        {displayArray.map((val, i) => {
          const isHighlighted = highlightIndices.includes(i);
          const isRoot = i === 0;
          return (
            <g key={i} transform={`translate(${positions[i].x},${positions[i].y})`}>
              <circle r="18" fill={isHighlighted ? '#0c4a6e' : isRoot ? '#14532d' : '#1e293b'}
                stroke={isHighlighted ? '#38bdf8' : isRoot ? '#4ade80' : '#334155'}
                strokeWidth={isHighlighted ? 3 : 2}
                className="transition-all duration-300" />
              <text y="5" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="Inter">
                {Math.round(val)}
              </text>
              <text y="32" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="JetBrains Mono">
                [{i}]
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const pseudoLine = currentStepData
    ? currentStepData.type === 'insert' ? 2
    : currentStepData.type === 'extract' ? 6
    : currentStepData.type === 'swap' ? 13
    : currentStepData.type === 'heapify' ? 17
    : -1 : -1;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-accent-green" />
          <h2 className="text-sm font-semibold text-white">Max Heap Priority Queue</h2>
          <span className="text-xs text-dark-500 ml-2">O(log n) per operation</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={buildFromBins} className="btn-primary py-1.5 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Build from Bins
          </button>
          <button onClick={insertRandom} className="btn-success py-1.5 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Insert
          </button>
          <button onClick={extractMax} className="btn-danger py-1.5 flex items-center gap-1">
            <ArrowUp className="w-3.5 h-3.5" /> Extract Max
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Center: Tree + Array */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-3">
            {/* Heap Tree */}
            <div className="glass-card p-4">
              <h3 className="section-header">Heap Tree Visualization</h3>
              <div className="bg-dark-950/60 rounded-lg p-2 border border-dark-700/30">
                {renderTree()}
              </div>
            </div>

            {/* Array Representation */}
            <div className="glass-card p-4">
              <h3 className="section-header">Array Representation</h3>
              <div className="flex gap-1 flex-wrap">
                {displayArray.map((val, i) => (
                  <div key={i} className={`px-3 py-2 rounded-lg text-xs font-mono text-center min-w-[45px] transition-all ${
                    highlightIndices.includes(i)
                      ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40 scale-110'
                      : 'bg-dark-800/60 text-white border border-dark-700/30'
                  }`}>
                    <div className="font-bold">{Math.round(val)}</div>
                    <div className="text-[8px] text-dark-500">[{i}]</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Description */}
            {currentStepData && (
              <div className="glass-card p-4">
                <h3 className="section-header">Current Operation</h3>
                <p className="text-sm text-accent-blue">{currentStepData.description}</p>
              </div>
            )}

            {/* Priority Formula */}
            <div className="glass-card p-4">
              <h3 className="section-header">Priority Formula</h3>
              <div className="bg-dark-950/60 rounded-lg p-3 border border-dark-700/30 font-mono text-xs text-dark-500">
                <p>Priority = <span className="text-accent-blue">FillLevel × 0.4</span></p>
                <p className="ml-8">+ <span className="text-accent-orange">ComplaintCount × 5</span></p>
                <p className="ml-8">+ <span className="text-accent-red">Hospital ? 20 : 0</span></p>
                <p className="ml-8">+ <span className="text-accent-yellow">School ? 15 : 0</span></p>
                <p className="ml-8">+ <span className="text-accent-purple">SmellScore × 3</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 shrink-0 glass-panel border-l border-dark-700/30 overflow-y-auto p-3 space-y-3">
          {steps.length > 0 && (
            <PlaybackControls
              isPlaying={isPlaying} speed={speed}
              currentStep={currentStep} totalSteps={steps.length - 1}
              onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
              onStepForward={() => setCurrentStep(s => Math.min(s + 1, steps.length - 1))}
              onStepBackward={() => setCurrentStep(s => Math.max(s - 1, 0))}
              onReset={() => { setCurrentStep(0); setIsPlaying(false); }}
              onSpeedChange={setSpeed}
            />
          )}

          {/* Heap Info */}
          <div className="glass-card p-4">
            <h3 className="section-header">Heap Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-dark-500">Size</span><span className="text-white font-mono">{displayArray.length}</span></div>
              <div className="flex justify-between"><span className="text-dark-500">Max (Root)</span><span className="text-accent-green font-mono">{displayArray.length > 0 ? Math.round(displayArray[0]) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-dark-500">Total Steps</span><span className="text-accent-blue font-mono">{steps.length}</span></div>
              <div className="flex justify-between"><span className="text-dark-500">Complexity</span><span className="text-accent-purple font-mono">O(log n)</span></div>
            </div>
          </div>

          <PseudocodePanel title="Heap Operations" lines={PSEUDOCODE} highlightedLine={pseudoLine} />
        </div>
      </div>
    </div>
  );
};

export default HeapVisualizer;
