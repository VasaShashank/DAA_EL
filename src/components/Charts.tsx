import React from 'react';
import { useSimulationStore } from '../store';
import { calculatePriority } from '../utils/algorithms';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const ChartsPanel: React.FC = () => {
  const { nodes, metrics } = useSimulationStore();

  const bins = nodes.filter(n => !n.isDepot);

  const fillLevelData = bins.map(b => ({
    name: `B${b.id}`,
    fill: Math.round(b.fillLevel)
  })).sort((a, b) => b.fill - a.fill).slice(0, 10);

  const priorityData = bins.map(b => ({
    name: `B${b.id}`,
    priority: Math.round(calculatePriority(b))
  })).sort((a, b) => b.priority - a.priority).slice(0, 10);

  const overflowData = [
    { name: 'Normal', value: Math.max(0, bins.length - metrics.predictedOverflows), color: '#4ade80' },
    { name: 'At Risk', value: metrics.predictedOverflows, color: '#fb923c' }
  ];

  const savingsData = [
    { name: 'Unoptimized', value: Math.round(metrics.naiveDistance), color: '#64748b' },
    { name: 'Optimized', value: Math.round(metrics.totalDistanceTraveled), color: '#4ade80' }
  ];

  return (
    <div className="flex-1 glass-panel p-3 overflow-y-auto flex gap-3 overflow-x-auto">
      <div className="glass-card p-3 min-w-[260px] flex-1">
        <h3 className="text-[10px] font-bold text-dark-500 uppercase mb-2">Fill Levels</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fillLevelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="fill" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-3 min-w-[260px] flex-1">
        <h3 className="text-[10px] font-bold text-dark-500 uppercase mb-2">Priority Scores</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={9} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="priority" fill="#fb923c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-3 min-w-[180px] flex-1">
        <h3 className="text-[10px] font-bold text-dark-500 uppercase mb-2">Status</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={overflowData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={5} dataKey="value">
                {overflowData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-3 min-w-[220px] flex-1">
        <h3 className="text-[10px] font-bold text-dark-500 uppercase mb-2">Optimization</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={savingsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={9} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={70} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {savingsData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
