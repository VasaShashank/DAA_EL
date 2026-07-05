/**
 * 0/1 Knapsack Algorithm
 * Real waste bins cannot be partially collected — truck either services a bin completely or skips it.
 * Data Structures: DP Table, Arrays
 * Complexity: O(n * W) where n = items, W = capacity
 */
import type { KnapsackItem, KnapsackResult } from '../../types';

export interface KnapsackStep {
  i: number; // current item index
  w: number; // current weight being evaluated
  value: number; // value being written
  included: boolean; // whether this item is included at this cell
  dpTable: number[][]; // snapshot of current DP table
}

export function solveKnapsack(
  items: KnapsackItem[],
  capacity: number,
  recordSteps = false
): KnapsackResult & { steps: KnapsackStep[] } {
  const startTime = performance.now();
  const n = items.length;
  const W = Math.ceil(capacity);
  const steps: KnapsackStep[] = [];

  // Initialize DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  let dpStates = 0;

  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dpStates++;
      const item = items[i - 1];
      const itemWeight = Math.ceil(item.weight);

      if (itemWeight <= w) {
        const includeValue = dp[i - 1][w - itemWeight] + item.priority;
        const excludeValue = dp[i - 1][w];

        if (includeValue > excludeValue) {
          dp[i][w] = includeValue;
          if (recordSteps) {
            steps.push({
              i, w,
              value: includeValue,
              included: true,
              dpTable: dp.map(row => [...row]),
            });
          }
        } else {
          dp[i][w] = excludeValue;
          if (recordSteps) {
            steps.push({
              i, w,
              value: excludeValue,
              included: false,
              dpTable: dp.map(row => [...row]),
            });
          }
        }
      } else {
        dp[i][w] = dp[i - 1][w];
        if (recordSteps) {
          steps.push({
            i, w,
            value: dp[i][w],
            included: false,
            dpTable: dp.map(row => [...row]),
          });
        }
      }
    }
  }

  // Backtrack to find selected items
  const selectedItems: KnapsackItem[] = [];
  const skippedItems: KnapsackItem[] = [];
  let remainingW = W;

  for (let i = n; i > 0; i--) {
    if (dp[i][remainingW] !== dp[i - 1][remainingW]) {
      selectedItems.push(items[i - 1]);
      remainingW -= Math.ceil(items[i - 1].weight);
    } else {
      skippedItems.push(items[i - 1]);
    }
  }

  const totalWeight = selectedItems.reduce((sum, item) => sum + item.weight, 0);
  const totalPriority = selectedItems.reduce((sum, item) => sum + item.priority, 0);
  const executionTime = performance.now() - startTime;

  return {
    selectedItems,
    skippedItems,
    totalWeight,
    totalPriority,
    remainingCapacity: capacity - totalWeight,
    dpTable: dp,
    steps,
    stats: {
      algorithmName: '0/1 Knapsack',
      executionTime,
      theoreticalComplexity: 'O(n × W)',
      memoryUsage: (n + 1) * (W + 1) * 4,
      nodesExplored: n,
      edgesRelaxed: 0,
      heapOperations: 0,
      dpStates,
      prunedNodes: 0,
      totalCost: totalPriority,
    },
  };
}

// Calculate priority for a bin (used as knapsack value)
export function calculateBinPriority(node: {
  fillLevel: number;
  complaintCount: number;
  nearHospital: boolean;
  nearSchool: boolean;
  smellScore: number;
}): number {
  return (
    node.fillLevel * 0.4 +
    node.complaintCount * 5 +
    (node.nearHospital ? 20 : 0) +
    (node.nearSchool ? 15 : 0) +
    node.smellScore * 3
  );
}
