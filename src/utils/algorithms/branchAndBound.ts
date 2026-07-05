/**
 * Branch and Bound TSP
 * For destination count ≤ 8
 * Data Structures: Priority Queue, Graph, State Nodes
 * Complexity: O(n! / e) average case with pruning, worst O(n!)
 */
import type { NodeId, AlgorithmStats, BranchAndBoundNode, BranchAndBoundResult } from '../../types';

interface BBState {
  level: number;
  path: NodeId[];
  cost: number;
  lowerBound: number;
}

function calculateLowerBound(
  currentPath: NodeId[],
  currentCost: number,
  allNodes: NodeId[],
  distMatrix: Map<NodeId, Map<NodeId, number>>
): number {
  const visited = new Set(currentPath);
  let lb = currentCost;

  // For each unvisited node, add the minimum edge cost
  for (const node of allNodes) {
    if (visited.has(node)) continue;
    let minEdge = Infinity;
    for (const other of allNodes) {
      if (other === node) continue;
      const dist = distMatrix.get(node)?.get(other) ?? Infinity;
      if (dist < minEdge) minEdge = dist;
    }
    if (minEdge !== Infinity) lb += minEdge;
  }

  return lb;
}

export function branchAndBoundTSP(
  depot: NodeId,
  binsToVisit: NodeId[],
  distMatrix: Map<NodeId, Map<NodeId, number>>
): BranchAndBoundResult {
  const startTime = performance.now();
  const allNodes = [depot, ...binsToVisit];
  const n = allNodes.length;

  let bestCost = Infinity;
  let bestRoute: NodeId[] = [];
  const stateTree: BranchAndBoundNode[] = [];
  let statesGenerated = 0;
  let statesPruned = 0;
  let nodeIdCounter = 0;

  // Priority queue (sorted by lower bound)
  const queue: (BBState & { treeNodeId: number; parentTreeId: number | null })[] = [];

  // Root state
  const rootLB = calculateLowerBound([depot], 0, allNodes, distMatrix);
  const rootId = nodeIdCounter++;
  stateTree.push({
    id: rootId,
    level: 0,
    path: [depot],
    cost: 0,
    lowerBound: rootLB,
    isPruned: false,
    isOptimal: false,
    children: [],
    parentId: null,
  });

  queue.push({
    level: 0,
    path: [depot],
    cost: 0,
    lowerBound: rootLB,
    treeNodeId: rootId,
    parentTreeId: null,
  });

  statesGenerated++;

  while (queue.length > 0) {
    // Sort by lower bound (best-first)
    queue.sort((a, b) => a.lowerBound - b.lowerBound);
    const current = queue.shift()!;

    // Prune if lower bound >= best known
    if (current.lowerBound >= bestCost) {
      statesPruned++;
      const treeNode = stateTree.find(n => n.id === current.treeNodeId);
      if (treeNode) treeNode.isPruned = true;
      continue;
    }

    const visited = new Set(current.path);

    // If all nodes visited, check return to depot
    if (current.path.length === n) {
      const returnCost = distMatrix.get(current.path[current.path.length - 1])?.get(depot) ?? Infinity;
      const totalCost = current.cost + returnCost;

      if (totalCost < bestCost) {
        bestCost = totalCost;
        bestRoute = [...current.path, depot];
      }
      continue;
    }

    // Expand children
    for (const nextNode of allNodes) {
      if (visited.has(nextNode)) continue;

      const edgeCost = distMatrix.get(current.path[current.path.length - 1])?.get(nextNode) ?? Infinity;
      if (edgeCost === Infinity) continue;

      const newCost = current.cost + edgeCost;
      const newPath = [...current.path, nextNode];
      const lb = calculateLowerBound(newPath, newCost, allNodes, distMatrix);

      const childId = nodeIdCounter++;
      statesGenerated++;

      const isPruned = lb >= bestCost;
      if (isPruned) statesPruned++;

      stateTree.push({
        id: childId,
        level: current.level + 1,
        path: newPath,
        cost: newCost,
        lowerBound: lb,
        isPruned,
        isOptimal: false,
        children: [],
        parentId: current.treeNodeId,
      });

      // Add child reference to parent
      const parentNode = stateTree.find(n => n.id === current.treeNodeId);
      if (parentNode) parentNode.children.push(childId);

      if (!isPruned) {
        queue.push({
          level: current.level + 1,
          path: newPath,
          cost: newCost,
          lowerBound: lb,
          treeNodeId: childId,
          parentTreeId: current.treeNodeId,
        });
      }
    }
  }

  // Mark optimal path nodes
  for (const treeNode of stateTree) {
    if (treeNode.path.length > 0) {
      const isOnOptimalPath = bestRoute.length > 0 &&
        treeNode.path.every((node, idx) => bestRoute[idx] === node);
      if (isOnOptimalPath) treeNode.isOptimal = true;
    }
  }

  const executionTime = performance.now() - startTime;

  return {
    optimalRoute: bestRoute,
    optimalCost: bestCost,
    stateTree,
    statesGenerated,
    statesPruned,
    stats: {
      algorithmName: 'Branch and Bound TSP',
      executionTime,
      theoreticalComplexity: 'O(n!)',
      memoryUsage: statesGenerated * 64,
      nodesExplored: statesGenerated - statesPruned,
      edgesRelaxed: 0,
      heapOperations: statesGenerated,
      dpStates: 0,
      prunedNodes: statesPruned,
      totalCost: bestCost,
    },
  };
}

// Nearest Neighbor TSP heuristic (for > 8 destinations)
export function nearestNeighborTSP(
  depot: NodeId,
  binsToVisit: NodeId[],
  distMatrix: Map<NodeId, Map<NodeId, number>>
): { route: NodeId[]; cost: number; stats: AlgorithmStats } {
  const startTime = performance.now();
  if (binsToVisit.length === 0) {
    return {
      route: [depot, depot],
      cost: 0,
      stats: {
        algorithmName: 'Greedy Nearest Neighbor',
        executionTime: 0,
        theoreticalComplexity: 'O(n²)',
        memoryUsage: 0,
        nodesExplored: 0,
        edgesRelaxed: 0,
        heapOperations: 0,
        dpStates: 0,
        prunedNodes: 0,
        totalCost: 0,
      },
    };
  }

  const unvisited = new Set(binsToVisit);
  const route: NodeId[] = [depot];
  let cost = 0;
  let current = depot;
  let nodesExplored = 0;

  while (unvisited.size > 0) {
    let nextNode: NodeId | null = null;
    let minDistance = Infinity;

    for (const candidate of unvisited) {
      const dist = distMatrix.get(current)?.get(candidate) ?? Infinity;
      if (dist < minDistance) {
        minDistance = dist;
        nextNode = candidate;
      }
      nodesExplored++;
    }

    if (nextNode !== null) {
      route.push(nextNode);
      unvisited.delete(nextNode);
      cost += minDistance;
      current = nextNode;
    } else {
      break;
    }
  }

  const returnDist = distMatrix.get(current)?.get(depot) ?? Infinity;
  route.push(depot);
  cost += returnDist;

  const executionTime = performance.now() - startTime;

  return {
    route,
    cost,
    stats: {
      algorithmName: 'Greedy Nearest Neighbor',
      executionTime,
      theoreticalComplexity: 'O(n²)',
      memoryUsage: binsToVisit.length * 8,
      nodesExplored,
      edgesRelaxed: 0,
      heapOperations: 0,
      dpStates: 0,
      prunedNodes: 0,
      totalCost: cost,
    },
  };
}

// Naive TSP baseline for comparison
export function naiveTSP(
  depot: NodeId,
  binsToVisit: NodeId[],
  distMatrix: Map<NodeId, Map<NodeId, number>>
): number {
  let naiveDistance = 0;
  let current = depot;
  for (const bin of binsToVisit) {
    naiveDistance += distMatrix.get(current)?.get(bin) ?? 0;
    current = bin;
  }
  naiveDistance += distMatrix.get(current)?.get(depot) ?? 0;
  return naiveDistance;
}
