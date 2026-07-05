import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../store';
import { buildAdjacencyList, buildDistanceMatrix, solveTSPNearestNeighbor } from '../utils/algorithms';
import type { NodeId } from '../types';

export const useAlgorithmVisualizer = () => {
  const store = useSimulationStore();
  const stepRef = useRef<number | undefined>(undefined);
  const lastStepTime = useRef<number>(0);

  // Dijkstra Generator Function
  const dijkstraGenerator = function* (startNode: NodeId, endNode: NodeId) {
    const { nodes, edges } = useSimulationStore.getState();
    const adj = buildAdjacencyList(nodes, edges);
    const distances: Record<NodeId, number> = {};
    const previous: Record<NodeId, NodeId | null> = {};
    const unvisited = new Set<NodeId>();

    nodes.forEach(n => {
      distances[n.id] = Infinity;
      previous[n.id] = null;
      unvisited.add(n.id);
    });

    distances[startNode] = 0;

    while (unvisited.size > 0) {
      let current: NodeId | null = null;
      let minDistance = Infinity;

      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      });

      if (current === null || minDistance === Infinity) break;

      const pq = Array.from(unvisited).map(id => ({ id, distance: distances[id] })).filter(item => item.distance !== Infinity).sort((a, b) => a.distance - b.distance);

      useSimulationStore.setState({
        dijkstraState: {
          startNode, endNode,
          currentNode: current,
          visited: new Set(Array.from(nodes.map(n => n.id)).filter(id => !unvisited.has(id))),
          priorityQueue: pq,
          distances: { ...distances },
          previous: { ...previous },
          relaxingEdges: [],
          finalPath: [],
          isComplete: false,
        }
      });
      yield;

      if (current === endNode) break;

      unvisited.delete(current);
      const neighbors = adj.get(current) || [];

      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.target)) continue;

        useSimulationStore.setState(prev => ({
          dijkstraState: prev.dijkstraState ? {
            ...prev.dijkstraState,
            relaxingEdges: [{ source: current!, target: neighbor.target }]
          } : null
        }));
        yield;

        const alt = distances[current] + neighbor.distance;
        if (alt < distances[neighbor.target]) {
          distances[neighbor.target] = alt;
          previous[neighbor.target] = current;
        }
      }
    }

    // Highlight final path
    let curr: NodeId | null = endNode;
    const pathEdges: { source: number; target: number }[] = [];
    const finalPath: NodeId[] = [];
    while (curr !== null && previous[curr] !== null) {
      finalPath.unshift(curr);
      pathEdges.push({ source: previous[curr]!, target: curr });
      curr = previous[curr];
    }
    if (curr !== null) finalPath.unshift(curr);

    useSimulationStore.setState(prev => ({
      dijkstraState: prev.dijkstraState ? {
        ...prev.dijkstraState,
        currentNode: null,
        relaxingEdges: pathEdges,
        finalPath,
        isComplete: true,
      } : null
    }));
  };

  useEffect(() => {
    let generator: Generator | null = null;
    const mode = store.activeMode;

    const animateVisualizer = (time: number) => {
      if (time - lastStepTime.current > (1000 / (store.speed * 2))) {

        if (mode === 'DIJKSTRA') {
          const state = useSimulationStore.getState();
          if (!state.dijkstraState && state.nodes.length > 0) {
            const start = state.nodes[0].id;
            const end = state.nodes[Math.floor(Math.random() * (state.nodes.length - 1)) + 1].id;
            generator = dijkstraGenerator(start, end);
            useSimulationStore.getState().addLog(`Started Dijkstra visualization from ${start} to ${end}`, 'INFO');
          }

          if (generator) {
            const result = generator.next();
            if (result.done) {
              generator = null;
              setTimeout(() => {
                if (useSimulationStore.getState().activeMode === 'DIJKSTRA') {
                  useSimulationStore.setState({ dijkstraState: null });
                }
              }, 3000);
            }
          }
        } else if (mode === 'TSP') {
          const state = useSimulationStore.getState();
          if (!state.tspState && state.nodes.length > 0) {
            const numBins = 4 + Math.floor(Math.random() * 3);
            const bins = [...state.nodes].filter(n => !n.isDepot).sort(() => Math.random() - 0.5).slice(0, numBins).map(n => n.id);

            useSimulationStore.setState({
              tspState: {
                selectedBins: bins,
                currentBestRoute: [],
                currentCost: 0,
                evaluatingRoute: null,
                isFinished: false
              }
            });

            const distMatrix = buildDistanceMatrix([0, ...bins], state.nodes, state.edges);
            const result = solveTSPNearestNeighbor(0, bins, distMatrix);

            useSimulationStore.getState().addLog(`TSP Route found for ${bins.length} bins. Cost: ${result.cost}`, 'SUCCESS');

            useSimulationStore.setState({
              tspState: {
                selectedBins: bins,
                currentBestRoute: result.route,
                currentCost: result.cost,
                evaluatingRoute: null,
                isFinished: true
              }
            });

            setTimeout(() => {
              if (useSimulationStore.getState().activeMode === 'TSP') {
                useSimulationStore.setState({ tspState: null });
              }
            }, 5000);
          }
        }

        lastStepTime.current = time;
      }

      if (useSimulationStore.getState().activeMode !== 'MAIN') {
        stepRef.current = requestAnimationFrame(animateVisualizer);
      }
    };

    if (mode === 'DIJKSTRA' || mode === 'TSP') {
      stepRef.current = requestAnimationFrame(animateVisualizer);
    } else {
      useSimulationStore.setState({ dijkstraState: null, tspState: null });
    }

    return () => {
      if (stepRef.current) cancelAnimationFrame(stepRef.current);
    };
  }, [store.activeMode, store.speed, store.nodes.length]);
};
