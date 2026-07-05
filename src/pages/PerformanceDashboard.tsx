import React, { useMemo } from 'react';
import { useSimulationStore } from '../store';
import type { AlgorithmRun } from '../types';
import { BarChart3, Clock, Cpu, HardDrive, Search, Fuel, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#38bdf8', '#a78bfa', '#4ade80', '#fb923c', '#f87171', '#22d3ee', '#facc15', '#f472b6'];

export const PerformanceDashboard: React.FC = () => {
  const { algorithmRuns, metrics } = useSimulationStore();

  const groupedRuns = useMemo(() => {
    const groups: Record<string, AlgorithmRun[]> = {};
    algorithmRuns.forEach(run => {
      if (!groups[run.stats.algorithmName]) groups[run.stats.algorithmName] = [];
      groups[run.stats.algorithmName].push(run);
    });
    return groups;
  }, [algorithmRuns]);

  const latestRuns = useMemo(() => {
    return Object.entries(groupedRuns).map(([name, runs]) => ({
      name: name.length > 18 ? name.substring(0, 18) + '…' : name,
      fullName: name,
      ...runs[0].stats,
      runCount: runs.length,
    }));
  }, [groupedRuns]);

  // Chart data
  const executionTimeData = latestRuns.map(r => ({
    name: r.name,
    value: parseFloat(r.executionTime.toFixed(3)),
  }));

  const nodesExploredData = latestRuns.map(r => ({
    name: r.name,
    value: r.nodesExplored,
  }));

  const memoryData = latestRuns.map(r => ({
    name: r.name,
    value: Math.round(r.memoryUsage / 1024 * 100) / 100,
  }));

  const fuelSaved = metrics.totalFuelSaved;
  const co2Saved = fuelSaved * 2.31;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold text-white">Performance Dashboard</h2>
          <span className="text-xs text-dark-500 ml-2">{algorithmRuns.length} algorithm runs recorded</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {algorithmRuns.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-500">No Algorithm Runs Yet</h3>
              <p className="text-sm text-dark-600 mt-1">Run algorithms from other pages to see performance data here</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Summary Cards */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Fuel className="w-4 h-4 text-accent-green" />
                <span className="text-xs text-dark-500 font-bold uppercase">Fuel Saved</span>
              </div>
              <p className="text-3xl font-bold text-accent-green">{Math.round(fuelSaved)} L</p>
              <p className="text-xs text-dark-500 mt-1">Through optimized routing</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-accent-green" />
                <span className="text-xs text-dark-500 font-bold uppercase">CO₂ Saved</span>
              </div>
              <p className="text-3xl font-bold text-accent-green">{co2Saved.toFixed(1)} kg</p>
              <p className="text-xs text-dark-500 mt-1">Emission reduction</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-accent-blue" />
                <span className="text-xs text-dark-500 font-bold uppercase">Algorithms Used</span>
              </div>
              <p className="text-3xl font-bold text-accent-blue">{Object.keys(groupedRuns).length}</p>
              <p className="text-xs text-dark-500 mt-1">{algorithmRuns.length} total executions</p>
            </div>

            {/* Execution Time Chart */}
            <div className="glass-card p-5 lg:col-span-2 xl:col-span-2">
              <h3 className="section-header"><Clock className="w-4 h-4" /> Execution Time (ms)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={executionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {executionTimeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Nodes Explored */}
            <div className="glass-card p-5">
              <h3 className="section-header"><Search className="w-4 h-4" /> Nodes Explored</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nodesExploredData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {nodesExploredData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Algorithm Details Table */}
            <div className="glass-card p-5 lg:col-span-2 xl:col-span-3">
              <h3 className="section-header"><Cpu className="w-4 h-4" /> Algorithm Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-dark-700/30">
                      <th className="text-left py-2 px-3 text-dark-500">Algorithm</th>
                      <th className="text-right py-2 px-3 text-dark-500">Complexity</th>
                      <th className="text-right py-2 px-3 text-dark-500">Time (ms)</th>
                      <th className="text-right py-2 px-3 text-dark-500">Memory</th>
                      <th className="text-right py-2 px-3 text-dark-500">Nodes</th>
                      <th className="text-right py-2 px-3 text-dark-500">Edges</th>
                      <th className="text-right py-2 px-3 text-dark-500">Heap Ops</th>
                      <th className="text-right py-2 px-3 text-dark-500">DP States</th>
                      <th className="text-right py-2 px-3 text-dark-500">Pruned</th>
                      <th className="text-right py-2 px-3 text-dark-500">Runs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestRuns.map((r, i) => (
                      <tr key={i} className="border-b border-dark-700/20 hover:bg-dark-800/30">
                        <td className="py-2 px-3 text-white font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {r.fullName}
                        </td>
                        <td className="text-right py-2 px-3 text-accent-purple font-mono">{r.theoreticalComplexity}</td>
                        <td className="text-right py-2 px-3 text-accent-green font-mono">{r.executionTime.toFixed(3)}</td>
                        <td className="text-right py-2 px-3 text-accent-orange font-mono">
                          {r.memoryUsage > 1024 ? `${(r.memoryUsage / 1024).toFixed(1)}KB` : `${r.memoryUsage}B`}
                        </td>
                        <td className="text-right py-2 px-3 text-accent-blue font-mono">{r.nodesExplored}</td>
                        <td className="text-right py-2 px-3 font-mono text-dark-500">{r.edgesRelaxed}</td>
                        <td className="text-right py-2 px-3 font-mono text-dark-500">{r.heapOperations}</td>
                        <td className="text-right py-2 px-3 font-mono text-dark-500">{r.dpStates}</td>
                        <td className="text-right py-2 px-3 text-accent-red font-mono">{r.prunedNodes}</td>
                        <td className="text-right py-2 px-3 font-mono text-dark-500">{r.runCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="glass-card p-5 lg:col-span-2 xl:col-span-3">
              <h3 className="section-header"><HardDrive className="w-4 h-4" /> Memory Usage (KB)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#fb923c" radius={[6, 6, 0, 0]}>
                      {memoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
