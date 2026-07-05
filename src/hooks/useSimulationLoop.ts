import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../store';
import { getShortestPath, buildDistanceMatrix, solveTSPNearestNeighbor, solveTSPNaive, calculatePriority } from '../utils/algorithms';

export const useSimulationLoop = () => {
  const store = useSimulationStore();
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = (time: number) => {
      if (store.isRunning) {
        if (lastTimeRef.current !== undefined) {
          const deltaTime = time - lastTimeRef.current;
          if (deltaTime >= 100 / store.speed) {
            store.tick();
            updateTrucks();
            lastTimeRef.current = time;
          }
        } else {
          lastTimeRef.current = time;
        }
      } else {
        lastTimeRef.current = undefined;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [store.isRunning, store.speed, store.nodes, store.trucks, store.activeMode]);

  const updateTrucks = () => {
    const state = useSimulationStore.getState();
    const { trucks, nodes, edges, addLog } = state;

    if (state.activeMode === 'MAIN') {
      const idleTrucks = trucks.filter(t => t.status === 'IDLE');
      const currentlyAssignedBins = new Set<number>();
      trucks.forEach(t => {
        if (t.status !== 'IDLE') {
          t.route.forEach(binId => currentlyAssignedBins.add(binId));
        }
      });

      if (idleTrucks.length > 0) {
        const urgentBins = nodes
          .filter(n => !n.isDepot && !currentlyAssignedBins.has(n.id) && calculatePriority(n) > 40)
          .sort((a, b) => calculatePriority(b) - calculatePriority(a));

        if (urgentBins.length > 0) {
          let availableBins = [...urgentBins];

          useSimulationStore.setState(prev => {
            const newTrucks = [...prev.trucks];
            let newMetrics = { ...prev.metrics };

            for (const truck of idleTrucks) {
              if (availableBins.length === 0) break;
              const routeBins = availableBins.slice(0, 4);
              availableBins = availableBins.slice(4);
              const binsToVisit = routeBins.map(b => b.id);
              const distanceMatrix = buildDistanceMatrix([0, ...binsToVisit], nodes, edges);
              const { route, cost: optimizedCost } = solveTSPNearestNeighbor(0, binsToVisit, distanceMatrix);
              const binsInIdOrder = [...binsToVisit].sort((a, b) => a - b);
              const naiveCost = solveTSPNaive(0, binsInIdOrder, distanceMatrix);
              newMetrics.naiveDistance += naiveCost;
              newMetrics.totalFuelSaved += Math.max(0, (naiveCost - optimizedCost) / 4);

              const truckIdx = newTrucks.findIndex(t => t.id === truck.id);
              if (truckIdx !== -1) {
                newTrucks[truckIdx] = {
                  ...newTrucks[truckIdx],
                  status: 'EN_ROUTE',
                  route: route,
                  path: [],
                };
              }

              setTimeout(() => {
                useSimulationStore.getState().addLog(`Dispatched ${truck.id} to collect ${binsToVisit.length} bins.`, 'INFO');
              }, 10);
            }
            return { trucks: newTrucks, metrics: newMetrics };
          });
        }
      }
    }

    // Move trucks
    useSimulationStore.setState(prev => {
      let metricsUpdated = { ...prev.metrics };
      let newNodes = [...prev.nodes];

      const newTrucks = prev.trucks.map(truck => {
        if (truck.status === 'IDLE') return truck;
        let updatedTruck = { ...truck };

        if (updatedTruck.status === 'EN_ROUTE' && updatedTruck.targetNode === null) {
          if (updatedTruck.route.length > 0) {
            const nextBin = updatedTruck.route[0];
            if (nextBin === updatedTruck.currentNode) {
              updatedTruck.route = updatedTruck.route.slice(1);
              if (updatedTruck.route.length === 0) {
                updatedTruck.status = 'IDLE';
                return updatedTruck;
              }
              return updatedTruck;
            }

            const { path } = getShortestPath(updatedTruck.currentNode!, nextBin, prev.nodes, prev.edges);
            if (path.length > 0) {
              updatedTruck.path = path.slice(1);
              updatedTruck.targetNode = updatedTruck.path[0];
              updatedTruck.progress = 0;
            } else {
              addLog(`Warning: No path to node ${nextBin}`, 'WARNING');
              updatedTruck.route = updatedTruck.route.slice(1);
            }
          } else {
            updatedTruck.status = 'IDLE';
          }
        }

        if (updatedTruck.targetNode !== null) {
          const edge = prev.edges.find(e =>
            (e.source === updatedTruck.currentNode && e.target === updatedTruck.targetNode) ||
            (e.source === updatedTruck.targetNode && e.target === updatedTruck.currentNode)
          );

          const speedMultiplier = 0.05 * prev.speed;
          updatedTruck.progress += speedMultiplier;

          if (updatedTruck.progress >= 1) {
            const edgeDistance = edge?.distance || 1;
            updatedTruck.totalDistanceTraveled += edgeDistance;
            metricsUpdated.totalDistanceTraveled += edgeDistance;
            updatedTruck.currentNode = updatedTruck.targetNode;
            updatedTruck.progress = 0;

            if (updatedTruck.path.length <= 1) {
              const binId = updatedTruck.targetNode;
              updatedTruck.targetNode = null;
              updatedTruck.path = [];
              updatedTruck.route = updatedTruck.route.slice(1);

              if (binId === 0) {
                updatedTruck.status = 'IDLE';
                updatedTruck.currentLoad = 0;
                addLog('Truck returned to depot and unloaded.', 'SUCCESS');
              } else {
                const nodeIdx = newNodes.findIndex(n => n.id === binId);
                if (nodeIdx !== -1) {
                  const bin = newNodes[nodeIdx];
                  if (bin.fillLevel < 35) {
                    addLog(`Skipped Bin ${binId} - Fill ${Math.round(bin.fillLevel)}% below threshold.`, 'WARNING');
                  } else if (updatedTruck.currentLoad + bin.wasteWeight > updatedTruck.capacity) {
                    addLog(`Truck full! Returning from Bin ${binId}.`, 'WARNING');
                    updatedTruck.route = [0];
                    updatedTruck.status = 'RETURNING';
                  } else {
                    updatedTruck.currentLoad += bin.wasteWeight;
                    metricsUpdated.totalWasteCollected += bin.wasteWeight;
                    newNodes[nodeIdx] = { ...bin, fillLevel: 0, wasteWeight: 0 };
                    addLog(`Collected waste from Bin ${binId}.`, 'INFO');
                    if (updatedTruck.currentLoad >= updatedTruck.capacity) {
                      updatedTruck.route = [0];
                      updatedTruck.status = 'RETURNING';
                    }
                  }
                }
              }
            } else {
              updatedTruck.path = updatedTruck.path.slice(1);
              updatedTruck.targetNode = updatedTruck.path[0];
            }
          }
        }

        return updatedTruck;
      });

      return { trucks: newTrucks, metrics: metricsUpdated, nodes: newNodes };
    });
  };
};
