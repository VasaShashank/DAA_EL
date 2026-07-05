import React, { useState, useEffect, useCallback } from 'react';
import { useSimulationStore } from '../store';
import { solveKnapsack, calculateBinPriority } from '../utils/algorithms/knapsack';
import type { KnapsackItem, AlgorithmStats } from '../types';
import type { KnapsackStep } from '../utils/algorithms/knapsack';
import { PlaybackControls } from '../components/visualizers/PlaybackControls';
import { StatsPanel } from '../components/visualizers/StatsPanel';
import { PseudocodePanel } from '../components/visualizers/PseudocodePanel';
import { Package, CheckCircle2, XCircle } from 'lucide-react';

const PSEUDOCODE = [
  'function Knapsack_01(items, W):',
  '  dp[0..n][0..W] ← 0',
  '  for i ← 1 to n:',
  '    for w ← 0 to W:',
  '      if weight[i] ≤ w:',
  '        include ← dp[i-1][w-weight[i]] + val[i]',
  '        exclude ← dp[i-1][w]',
  '        dp[i][w] ← max(include, exclude)',
  '      else:',
  '        dp[i][w] ← dp[i-1][w]',
  '  backtrack to find selected items',
  '  return selected items',
];

export const KnapsackVisualizer: React.FC = () => {
  const { nodes, generateCity } = useSimulationStore();
  const [capacity, setCapacity] = useState(500);
  const [items, setItems] = useState<KnapsackItem[]>([]);
  const [steps, setSteps] = useState<KnapsackStep[]>([]);
  const [selected, setSelected] = useState<KnapsackItem[]>([]);
  const [skipped, setSkipped] = useState<KnapsackItem[]>([]);
  const [stats, setStats] = useState<AlgorithmStats | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [totalPriority, setTotalPriority] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [remainingCap, setRemainingCap] = useState(0);

  useEffect(() => { if (nodes.length === 0) generateCity(); }, [nodes.length, generateCity]);

  useEffect(() => {
    const bins = nodes.filter(n => !n.isDepot);
    setItems(bins.map(n => ({
      binId: n.id,
      weight: Math.round(n.wasteWeight || n.fillLevel * 2),
      priority: Math.round(calculateBinPriority(n)),
      fillLevel: n.fillLevel,
    })));
  }, [nodes]);

  const runKnapsack = useCallback(() => {
    if (items.length === 0) return;
    const result = solveKnapsack(items, capacity, true);
    setSteps(result.steps);
    setSelected(result.selectedItems);
    setSkipped(result.skippedItems);
    setStats(result.stats);
    setTotalPriority(result.totalPriority);
    setTotalWeight(result.totalWeight);
    setRemainingCap(result.remainingCapacity);
    setCurrentStep(0);
    setIsPlaying(false);

    useSimulationStore.getState().addAlgorithmRun({
      id: Math.random().toString(),
      timestamp: new Date(),
      stats: result.stats,
    });
  }, [items, capacity]);

  // Playback
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 50 / speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, steps, speed]);

  const currentStepData = steps[currentStep] || null;
  const pseudoLine = currentStepData ? (currentStepData.included ? 7 : 9) : -1;

  // Render DP table
  const renderDPTable = () => {
    if (!currentStepData) return null;
    const dp = currentStepData.dpTable;
    const maxW = Math.min(25, dp[0]?.length || 0); // Show up to 25 columns
    const n = dp.length;
    const stepW = currentStepData.w;

    return (
      <div className="overflow-x-auto">
        <table className="text-[9px] font-mono border-collapse mx-auto">
          <thead>
            <tr>
              <th className="px-1 py-0.5 text-dark-500 border border-dark-700/30 bg-dark-900">i\w</th>
              {Array.from({ length: maxW }, (_, w) => (
                <th key={w} className={`px-1 py-0.5 border border-dark-700/30 ${
                  w === stepW ? 'text-accent-blue bg-accent-blue/10' : 'text-dark-500 bg-dark-900/40'
                }`}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dp.slice(0, Math.min(n, items.length + 1)).map((row, i) => {
              const isPastRow = i < currentStepData.i;
              const isCurrentRow = i === currentStepData.i;

              return (
                <tr key={i} className={isCurrentRow ? 'bg-dark-800/20' : ''}>
                  <td className={`px-1 py-0.5 border border-dark-700/30 ${
                    i === currentStepData.i ? 'text-accent-blue bg-accent-blue/10 font-bold' : 'text-dark-500 bg-dark-900/40'
                  }`}>{i}</td>
                  {row.slice(0, maxW).map((val, w) => {
                    const isComputed = isPastRow || (isCurrentRow && w <= stepW);
                    const isCellEvaluating = isCurrentRow && w === stepW;

                    return (
                      <td key={w} className={`px-1 py-0.5 border border-dark-700/30 text-center min-w-[20px] ${
                        isCellEvaluating
                          ? currentStepData.included
                            ? 'bg-accent-green/30 text-accent-green font-bold scale-110 border-accent-green'
                            : 'bg-accent-orange/30 text-accent-orange font-bold scale-110 border-accent-orange'
                          : isComputed
                            ? val > 0 ? 'text-white' : 'text-dark-600'
                            : 'text-transparent select-none bg-dark-950/20'
                      }`}>
                        {isComputed ? val : '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-accent-orange" />
          <h2 className="text-sm font-semibold text-white">0/1 Knapsack — Truck Capacity Optimization</h2>
          <span className="text-xs text-dark-500 ml-2">O(n × W)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-dark-800/60 rounded-lg px-3 py-1.5 border border-dark-700/50">
            <span className="text-xs text-dark-500">Capacity:</span>
            <input type="number" min={100} max={2000} step={50} value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 500)}
              className="w-16 bg-transparent text-sm text-white font-mono text-center outline-none" />
            <span className="text-xs text-dark-500">kg</span>
          </div>
          <button onClick={runKnapsack} className="btn-primary py-1.5">Run Knapsack</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Items Table */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Items */}
            <div className="glass-card p-4">
              <h3 className="section-header">Bins (Items)</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {items.map(item => {
                  const isSelected = selected.some(s => s.binId === item.binId);
                  const isSkippedItem = skipped.some(s => s.binId === item.binId);
                  return (
                    <div key={item.binId} className={`flex items-center justify-between text-xs py-1.5 px-3 rounded-lg transition-all ${
                      isSelected ? 'bg-accent-green/10 border border-accent-green/30' :
                      isSkippedItem ? 'bg-accent-red/10 border border-accent-red/30' :
                      'bg-dark-800/40'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" /> :
                         isSkippedItem ? <XCircle className="w-3.5 h-3.5 text-accent-red" /> : null}
                        <span className="text-white font-medium">Bin {item.binId}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-dark-500">W: <span className="text-white">{item.weight}kg</span></span>
                        <span className="text-dark-500">P: <span className="text-accent-orange">{item.priority}</span></span>
                        <span className="text-dark-500">Fill: <span className="text-accent-blue">{Math.round(item.fillLevel)}%</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            <div className="space-y-3">
              {stats && (
                <div className="glass-card p-4">
                  <h3 className="section-header text-accent-green">Results</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-dark-500 uppercase">Total Weight</p>
                      <p className="text-lg font-bold text-white">{Math.round(totalWeight)}kg</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-dark-500 uppercase">Total Priority</p>
                      <p className="text-lg font-bold text-accent-orange">{Math.round(totalPriority)}</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-dark-500 uppercase">Remaining Cap</p>
                      <p className="text-lg font-bold text-accent-blue">{Math.round(remainingCap)}kg</p>
                    </div>
                    <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-dark-500 uppercase">Bins Selected</p>
                      <p className="text-lg font-bold text-accent-green">{selected.length}/{items.length}</p>
                    </div>
                  </div>
                </div>
              )}
              <StatsPanel stats={stats} />
            </div>

            {/* DP Table */}
            <div className="glass-card p-4 lg:col-span-2">
              <h3 className="section-header">DP Table</h3>
              {currentStepData ? renderDPTable() : (
                <p className="text-xs text-dark-500 text-center py-4">Run knapsack to see DP table construction</p>
              )}
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
          <PseudocodePanel title="0/1 Knapsack" lines={PSEUDOCODE} highlightedLine={pseudoLine} />
        </div>
      </div>
    </div>
  );
};

export default KnapsackVisualizer;
