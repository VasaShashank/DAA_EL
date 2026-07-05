import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Route, GitBranch, Package, Binary,
  TreeDeciduous, AlertTriangle, Leaf, BarChart3,
  ChevronLeft, ChevronRight, Cpu
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Main Simulation' },
  { to: '/dijkstra', icon: Route, label: 'Dijkstra', description: 'Shortest Path' },
  { to: '/tsp', icon: GitBranch, label: 'TSP', description: 'Branch & Bound' },
  { to: '/knapsack', icon: Package, label: 'Knapsack', description: '0/1 Optimization' },
  { to: '/heap', icon: Binary, label: 'Heap', description: 'Priority Queue' },
  { to: '/decision-tree', icon: TreeDeciduous, label: 'Decision Tree', description: 'Algorithm Selector' },
  { to: '/road-failure', icon: AlertTriangle, label: 'Road Failure', description: 'Failure Simulation' },
  { to: '/carbon', icon: Leaf, label: 'Carbon', description: 'Fuel & CO₂' },
  { to: '/performance', icon: BarChart3, label: 'Performance', description: 'Algorithm Stats' },
];

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen w-screen flex bg-dark-950 overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className={`${collapsed ? 'w-[72px]' : 'w-[220px]'} shrink-0 flex flex-col glass-panel transition-all duration-300 z-20`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-dark-700/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0 shadow-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">SMART WASTE</h1>
              <p className="text-[10px] text-accent-blue font-semibold uppercase tracking-widest">Optimizer Console</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link group ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0 group-[.active]:text-accent-blue transition-colors" />
              {!collapsed && (
                <div className="animate-fade-in min-w-0">
                  <span className="block text-sm font-medium truncate">{item.label}</span>
                  <span className="block text-[10px] text-dark-500 group-[.active]:text-dark-500 truncate">{item.description}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-dark-700/50 text-dark-500 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};
