import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import DijkstraVisualizer from './pages/DijkstraVisualizer';
import TSPVisualizer from './pages/TSPVisualizer';
import KnapsackVisualizer from './pages/KnapsackVisualizer';
import HeapVisualizer from './pages/HeapVisualizer';
import DecisionTreePage from './pages/DecisionTreePage';
import RoadFailurePage from './pages/RoadFailurePage';
import CarbonDashboard from './pages/CarbonDashboard';
import PerformanceDashboard from './pages/PerformanceDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dijkstra" element={<DijkstraVisualizer />} />
          <Route path="/tsp" element={<TSPVisualizer />} />
          <Route path="/knapsack" element={<KnapsackVisualizer />} />
          <Route path="/heap" element={<HeapVisualizer />} />
          <Route path="/decision-tree" element={<DecisionTreePage />} />
          <Route path="/road-failure" element={<RoadFailurePage />} />
          <Route path="/carbon" element={<CarbonDashboard />} />
          <Route path="/performance" element={<PerformanceDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
