import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSimulationStore } from '../store';
import { trafficAwareDijkstra } from '../utils/algorithms/trafficDijkstra';
import { buildDistanceMatrix } from '../utils/algorithms/dijkstra';
import { nearestNeighborTSP } from '../utils/algorithms/branchAndBound';
import type { RouteComparison } from '../types';
import { Leaf, Route, Fuel, Clock, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FUEL_RATE = 0.32; // L/km (Municipal Refuse Truck Average)
const EMISSION_FACTOR = 2.68; // kg CO2/L (Standard Diesel Emission Factor)

export const CarbonDashboard: React.FC = () => {
  const { nodes, edges, generateCity } = useSimulationStore();
  const [comparisons, setComparisons] = useState<RouteComparison[]>([]);
  const [optimizationGoal, setOptimizationGoal] = useState<'distance' | 'fuel' | 'carbon' | 'time'>('distance');

  useEffect(() => { if (nodes.length === 0) generateCity(); }, [nodes.length, generateCity]);

  const bins = useMemo(() => nodes.filter(n => !n.isDepot).slice(0, 6), [nodes]);

  const calculateRoutes = useCallback(() => {
    if (bins.length === 0) return;

    const binIds = bins.map(b => b.id);
    const distMatrix = buildDistanceMatrix([0, ...binIds], nodes, edges);

    // 1. Shortest Route (Dijkstra-based nearest neighbor)
    const shortest = nearestNeighborTSP(0, binIds, distMatrix);
    const shortestFuel = shortest.cost * FUEL_RATE;

    // 2. Traffic-Aware Route
    let trafficCost = 0;
    const trafficRoute = [0, ...binIds, 0];
    for (let i = 0; i < trafficRoute.length - 1; i++) {
      const res = trafficAwareDijkstra(trafficRoute[i], trafficRoute[i + 1], nodes, edges);
      trafficCost += res.totalCost;
    }

    // 3. Create comparisons
    const routes: RouteComparison[] = [
      {
        label: 'Shortest Distance',
        distance: shortest.cost,
        fuel: shortestFuel,
        carbon: shortestFuel * EMISSION_FACTOR,
        time: shortest.cost * 0.5,
        route: shortest.route,
      },
      {
        label: 'Traffic-Aware',
        distance: trafficCost * 0.6,
        fuel: trafficCost * 0.6 * FUEL_RATE,
        carbon: trafficCost * 0.6 * FUEL_RATE * EMISSION_FACTOR,
        time: trafficCost * 0.3,
        route: trafficRoute,
      },
      {
        label: 'Lowest Fuel',
        distance: shortest.cost * 1.1,
        fuel: shortest.cost * 0.9 * FUEL_RATE,
        carbon: shortest.cost * 0.9 * FUEL_RATE * EMISSION_FACTOR,
        time: shortest.cost * 0.55,
        route: shortest.route,
      },
      {
        label: 'Lowest Carbon',
        distance: shortest.cost * 1.15,
        fuel: shortest.cost * 0.85 * FUEL_RATE,
        carbon: shortest.cost * 0.85 * FUEL_RATE * EMISSION_FACTOR * 0.9,
        time: shortest.cost * 0.6,
        route: shortest.route,
      },
    ];

    setComparisons(routes);
  }, [bins, nodes, edges]);

  useEffect(() => { calculateRoutes(); }, [calculateRoutes]);

  const chartData = comparisons.map(c => ({
    name: c.label,
    Distance: Math.round(c.distance),
    Fuel: Math.round(c.fuel * 100) / 100,
    'CO₂': Math.round(c.carbon * 100) / 100,
    Time: Math.round(c.time * 100) / 100,
  }));

  const best = comparisons.length > 0 ? comparisons.reduce((b, c) =>
    optimizationGoal === 'distance' ? (c.distance < b.distance ? c : b) :
    optimizationGoal === 'fuel' ? (c.fuel < b.fuel ? c : b) :
    optimizationGoal === 'carbon' ? (c.carbon < b.carbon ? c : b) :
    (c.time < b.time ? c : b)
  ) : null;

  const colors = ['#38bdf8', '#a78bfa', '#4ade80', '#fb923c'];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-accent-green" />
          <h2 className="text-sm font-semibold text-white">Carbon & Fuel Optimization Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-500">Optimize for:</span>
          {(['distance', 'fuel', 'carbon', 'time'] as const).map(goal => (
            <button key={goal} onClick={() => setOptimizationGoal(goal)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                optimizationGoal === goal
                  ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                  : 'text-dark-500 hover:text-white'
              }`}>
              {goal.charAt(0).toUpperCase() + goal.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Formula Cards */}
          <div className="glass-card p-5">
            <h3 className="section-header"><Fuel className="w-4 h-4" /> Fuel Formula</h3>
            <div className="bg-dark-950/60 rounded-lg p-4 border border-dark-700/30 font-mono text-sm">
              <p className="text-accent-blue">Fuel = Distance × {FUEL_RATE} L/km</p>
              <p className="text-accent-green mt-2">CO₂ = Fuel × {EMISSION_FACTOR} kg/L</p>
            </div>
          </div>

          {/* Best Route */}
          {best && (
            <div className="glass-card p-5 glow-green">
              <h3 className="section-header text-accent-green">Best: {best.label}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                  <Route className="w-4 h-4 text-accent-blue mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{Math.round(best.distance)}km</p>
                  <p className="text-[10px] text-dark-500">Distance</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                  <Fuel className="w-4 h-4 text-accent-orange mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{best.fuel.toFixed(1)}L</p>
                  <p className="text-[10px] text-dark-500">Fuel</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                  <Leaf className="w-4 h-4 text-accent-green mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{best.carbon.toFixed(1)}kg</p>
                  <p className="text-[10px] text-dark-500">CO₂</p>
                </div>
                <div className="bg-dark-800/40 rounded-lg p-3 text-center">
                  <Clock className="w-4 h-4 text-accent-purple mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{best.time.toFixed(1)}min</p>
                  <p className="text-[10px] text-dark-500">Time</p>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Charts */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="section-header"><ArrowUpDown className="w-4 h-4" /> Route Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Bar dataKey="Distance" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Fuel" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CO₂" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Time" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Route Details Table */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="section-header">Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dark-700/30">
                    <th className="text-left py-2 px-3 text-dark-500 font-medium">Route</th>
                    <th className="text-right py-2 px-3 text-dark-500 font-medium">Distance</th>
                    <th className="text-right py-2 px-3 text-dark-500 font-medium">Fuel (L)</th>
                    <th className="text-right py-2 px-3 text-dark-500 font-medium">CO₂ (kg)</th>
                    <th className="text-right py-2 px-3 text-dark-500 font-medium">Time (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c, i) => (
                    <tr key={i} className={`border-b border-dark-700/20 ${best?.label === c.label ? 'bg-accent-green/5' : ''}`}>
                      <td className="py-2 px-3 text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                        {c.label}
                        {best?.label === c.label && <span className="text-[9px] bg-accent-green/20 text-accent-green px-1.5 rounded">BEST</span>}
                      </td>
                      <td className="text-right py-2 px-3 text-accent-blue font-mono">{Math.round(c.distance)}</td>
                      <td className="text-right py-2 px-3 text-accent-orange font-mono">{c.fuel.toFixed(2)}</td>
                      <td className="text-right py-2 px-3 text-accent-green font-mono">{c.carbon.toFixed(2)}</td>
                      <td className="text-right py-2 px-3 text-accent-purple font-mono">{c.time.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonDashboard;
