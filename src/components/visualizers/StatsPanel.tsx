import React from 'react';
import { Clock, Cpu, HardDrive, Search, ArrowRightLeft, Database, Scissors } from 'lucide-react';
import type { AlgorithmStats } from '../../types';

interface StatsPanelProps {
  stats: AlgorithmStats | null;
  className?: string;
}

const StatRow: React.FC<{ icon: React.ReactNode; label: string; value: string; color?: string }> = ({
  icon, label, value, color = 'text-accent-blue'
}) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-800/50 transition-colors">
    <div className="flex items-center gap-2 text-dark-500">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <span className={`text-xs font-mono font-semibold ${color}`}>{value}</span>
  </div>
);

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, className = '' }) => {
  if (!stats) return (
    <div className={`glass-card p-4 ${className}`}>
      <h3 className="section-header"><Cpu className="w-4 h-4" /> Statistics</h3>
      <p className="text-xs text-dark-500 text-center py-4">Run an algorithm to see statistics</p>
    </div>
  );

  return (
    <div className={`glass-card p-4 ${className}`}>
      <h3 className="section-header"><Cpu className="w-4 h-4" /> {stats.algorithmName}</h3>
      <div className="space-y-0.5">
        <StatRow
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Execution Time"
          value={`${stats.executionTime.toFixed(2)} ms`}
          color="text-accent-green"
        />
        <StatRow
          icon={<Cpu className="w-3.5 h-3.5" />}
          label="Complexity"
          value={stats.theoreticalComplexity}
          color="text-accent-purple"
        />
        <StatRow
          icon={<HardDrive className="w-3.5 h-3.5" />}
          label="Memory Usage"
          value={stats.memoryUsage > 1024 ? `${(stats.memoryUsage / 1024).toFixed(1)} KB` : `${stats.memoryUsage} B`}
          color="text-accent-orange"
        />
        <StatRow
          icon={<Search className="w-3.5 h-3.5" />}
          label="Nodes Explored"
          value={stats.nodesExplored.toString()}
        />
        {stats.edgesRelaxed > 0 && (
          <StatRow
            icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            label="Edges Relaxed"
            value={stats.edgesRelaxed.toString()}
          />
        )}
        {stats.heapOperations > 0 && (
          <StatRow
            icon={<Database className="w-3.5 h-3.5" />}
            label="Heap Operations"
            value={stats.heapOperations.toString()}
          />
        )}
        {stats.dpStates > 0 && (
          <StatRow
            icon={<Database className="w-3.5 h-3.5" />}
            label="DP States"
            value={stats.dpStates.toString()}
          />
        )}
        {stats.prunedNodes > 0 && (
          <StatRow
            icon={<Scissors className="w-3.5 h-3.5" />}
            label="Pruned Nodes"
            value={stats.prunedNodes.toString()}
            color="text-accent-red"
          />
        )}
      </div>
    </div>
  );
};
