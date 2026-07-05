import React, { useEffect } from 'react';
import { useSimulationStore } from '../store';
import { useSimulationLoop } from '../hooks/useSimulationLoop';
import { CityMap } from '../components/CityMap';
import { EventLog } from '../components/EventLog';
import { ChartsPanel } from '../components/Charts';
import { PriorityTable } from '../components/PriorityTable';
import { Play, Pause, FastForward, RotateCcw, Activity, AlertTriangle, Truck, Fuel, TrendingUp, MapPin } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="stat-card">
    <div className={`p-2.5 rounded-lg bg-dark-900/60 ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] text-dark-500 font-medium uppercase tracking-wider">{title}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { generateCity, nodes, metrics, isRunning, toggleSimulation, speed, setSpeed, binCount, setBinCount } = useSimulationStore();

  useSimulationLoop();

  useEffect(() => {
    if (nodes.length === 0) generateCity();
  }, [nodes.length, generateCity]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold text-white">City Dashboard</h2>
          <span className="text-xs text-dark-500 ml-2">Tick #{useSimulationStore.getState().tickCount}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Bin Count Input */}
          <div className="flex items-center gap-2 bg-dark-800/60 rounded-lg px-3 py-1.5 border border-dark-700/50">
            <span className="text-xs text-dark-500">Bins:</span>
            <input
              type="number"
              min={5} max={25}
              value={binCount}
              onChange={(e) => setBinCount(parseInt(e.target.value) || 10)}
              className="w-12 bg-transparent text-sm text-white font-mono text-center outline-none border-none"
            />
          </div>

          <button onClick={() => generateCity()} className="btn-primary flex items-center gap-2 py-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Generate
          </button>

          <div className="h-6 w-px bg-dark-700/50" />

          {/* Simulation Controls */}
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isRunning
                ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30'
                : 'bg-accent-green/20 text-accent-green border border-accent-green/30'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause' : 'Start'}
          </button>

          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 5 : 1)}
            className="btn-ghost flex items-center gap-1 py-1.5"
          >
            <FastForward className="w-3.5 h-3.5" />
            {speed}x
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Stats + Priority */}
        <div className="w-72 shrink-0 glass-panel border-r border-dark-700/30 overflow-y-auto p-3 space-y-3">
          <h3 className="section-header">
            <Activity className="w-4 h-4 text-accent-blue" /> City Analytics
          </h3>
          <StatCard title="Total Bins" value={metrics.totalBins}
            icon={<MapPin className="w-4 h-4 text-white" />} color="text-white" />
          <StatCard title="Urgent Bins" value={metrics.urgentBins}
            icon={<AlertTriangle className="w-4 h-4 text-accent-red" />} color="text-accent-red" />
          <StatCard title="Predicted Overflow" value={metrics.predictedOverflows}
            icon={<TrendingUp className="w-4 h-4 text-accent-orange" />} color="text-accent-orange" />
          <StatCard title="Waste Collected" value={`${Math.round(metrics.totalWasteCollected)}kg`}
            icon={<div className="w-4 h-4 bg-accent-green rounded" />} color="text-accent-green" />
          <StatCard title="Total Distance" value={`${Math.round(metrics.totalDistanceTraveled)}km`}
            icon={<Truck className="w-4 h-4 text-accent-blue" />} color="text-accent-blue" />
          <StatCard title="Fuel Saved" value={`${Math.round(metrics.totalFuelSaved)}L`}
            icon={<Fuel className="w-4 h-4 text-accent-green" />} color="text-accent-green" />

          <PriorityTable />
        </div>

        {/* Center: Map */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-3">
            <CityMap />
          </div>

          {/* Bottom Charts */}
          <div className="h-[220px] shrink-0 border-t border-dark-700/30">
            <ChartsPanel />
          </div>
        </div>

        {/* Right: Event Log */}
        <div className="w-72 shrink-0 glass-panel border-l border-dark-700/30 flex flex-col overflow-hidden">
          <EventLog />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
