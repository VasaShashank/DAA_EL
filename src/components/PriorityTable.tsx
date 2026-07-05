import React from 'react';
import { useSimulationStore } from '../store';
import { calculatePriority } from '../utils/algorithms';
import { motion, AnimatePresence } from 'framer-motion';
import { ListOrdered } from 'lucide-react';

export const PriorityTable: React.FC = () => {
  const { nodes } = useSimulationStore();

  const rankedBins = nodes
    .filter(n => !n.isDepot)
    .map(n => ({
      id: n.id,
      priority: calculatePriority(n),
      fill: n.fillLevel
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);

  return (
    <div className="glass-card flex flex-col">
      <div className="p-3 border-b border-dark-700/30 flex items-center gap-2">
        <ListOrdered className="w-4 h-4 text-accent-orange" />
        <h3 className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Priority Queue (Max Heap)</h3>
      </div>
      <div className="p-2 flex-1 overflow-hidden">
        <div className="grid grid-cols-3 text-[10px] font-semibold text-dark-600 pb-1.5 border-b border-dark-700/30 px-2">
          <span>Rank</span>
          <span>Bin</span>
          <span className="text-right">Score</span>
        </div>
        <div className="relative" style={{ height: rankedBins.length * 26 + 'px' }}>
          <AnimatePresence>
            {rankedBins.map((bin, index) => (
              <motion.div
                key={bin.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: index * 26 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute w-full grid grid-cols-3 text-[11px] py-1 px-2 bg-dark-800/40 rounded items-center"
                style={{ top: 0 }}
              >
                <span className="text-dark-500">#{index + 1}</span>
                <span className="text-white font-mono">Bin {bin.id}</span>
                <span className="text-right font-mono text-accent-orange font-medium">
                  {bin.priority.toFixed(1)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
