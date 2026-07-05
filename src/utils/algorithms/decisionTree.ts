/**
 * Decision Tree Based Algorithm Selector
 * Implements an actual Decision Tree object — no hardcoded if-else logic.
 * Traverses the tree to select the optimal algorithm based on current constraints.
 */
import type { DecisionTreeNode, DecisionTreeResult } from '../../types';

// Build the decision tree structure
const decisionTreeNodes: Map<string, DecisionTreeNode> = new Map();

function addNode(node: DecisionTreeNode) {
  decisionTreeNodes.set(node.id, node);
}

// Build the tree
addNode({
  id: 'root',
  condition: 'Demand > Capacity?',
  description: 'Check if total waste demand of bins exceeds truck capacity',
  yesChild: 'knapsack',
  noChild: 'check-destinations',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'knapsack',
  condition: '',
  description: 'Truck capacity exceeded — need to optimize bin selection',
  yesChild: null,
  noChild: null,
  result: '0/1 Knapsack',
  resultReason: 'Truck capacity exceeded. Must select optimal subset of bins to collect.',
  resultComplexity: 'O(n × W)',
});

addNode({
  id: 'check-destinations',
  condition: 'Single Destination?',
  description: 'Check if there is only one destination to visit',
  yesChild: 'dijkstra',
  noChild: 'check-count',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'dijkstra',
  condition: '',
  description: 'Single destination — use shortest path algorithm',
  yesChild: null,
  noChild: null,
  result: "Dijkstra's Algorithm",
  resultReason: 'Only one destination. Shortest path algorithm is optimal.',
  resultComplexity: 'O((V + E) log V)',
});

addNode({
  id: 'check-count',
  condition: 'Destinations ≤ 8?',
  description: 'Check if the number of destinations allows exact solution',
  yesChild: 'branch-bound',
  noChild: 'nearest-neighbor',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'branch-bound',
  condition: 'High Traffic?',
  description: 'Branch & Bound TSP with traffic conditions',
  yesChild: 'traffic-dijkstra-1',
  noChild: 'bb-tsp-final',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'bb-tsp-final',
  condition: '',
  description: 'Small enough for exact TSP solution',
  yesChild: null,
  noChild: null,
  result: 'Branch & Bound TSP',
  resultReason: 'Destination count ≤ 8. Exact solution is feasible with pruning.',
  resultComplexity: 'O(n!) with pruning',
});

addNode({
  id: 'nearest-neighbor',
  condition: 'High Traffic?',
  description: 'Nearest Neighbor TSP with traffic conditions',
  yesChild: 'traffic-dijkstra-2',
  noChild: 'nn-tsp-final',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'nn-tsp-final',
  condition: '',
  description: 'Too many destinations for exact solution',
  yesChild: null,
  noChild: null,
  result: 'Greedy Nearest Neighbor',
  resultReason: 'Destination count > 8. Heuristic approach needed for tractability.',
  resultComplexity: 'O(n²)',
});

addNode({
  id: 'traffic-dijkstra-1',
  condition: '',
  description: 'High traffic detected — recalculate with traffic-aware routing',
  yesChild: null,
  noChild: null,
  result: 'Traffic-Aware Dijkstra',
  resultReason: 'High traffic conditions detected. Recomputing with dynamic edge weights.',
  resultComplexity: 'O((V + E) log V)',
});

addNode({
  id: 'traffic-dijkstra-2',
  condition: '',
  description: 'High traffic detected — recalculate with traffic-aware routing',
  yesChild: null,
  noChild: null,
  result: 'Traffic-Aware Dijkstra',
  resultReason: 'High traffic conditions detected. Recomputing with dynamic edge weights.',
  resultComplexity: 'O((V + E) log V)',
});

export interface DecisionContext {
  truckFull: boolean;
  destinationCount: number;
  hasHighTraffic: boolean;
  hasRoadFailures: boolean;
}

export function traverseDecisionTree(context: DecisionContext): DecisionTreeResult {
  const traversalPath: string[] = [];
  const decisions: DecisionTreeResult['decisions'] = [];
  let currentId = 'root';
  let chosenAlgorithm = 'Dijkstra';
  let reason = '';
  let complexity = '';

  while (currentId) {
    const node = decisionTreeNodes.get(currentId);
    if (!node) break;

    traversalPath.push(currentId);

    // If it's a leaf node (has a result)
    if (node.result) {
      chosenAlgorithm = node.result;
      reason = node.resultReason || '';
      complexity = node.resultComplexity || '';

      // Check for additional modifiers (traffic check from leaf)
      if (node.yesChild && node.condition) {
        const condResult = evaluateCondition(node.condition, context);
        decisions.push({
          nodeId: currentId,
          condition: node.condition,
          result: condResult,
          reason: condResult ? 'Condition met' : 'Condition not met',
        });
        if (condResult && node.yesChild) {
          currentId = node.yesChild;
          continue;
        }
      }
      break;
    }

    // Evaluate condition
    const condResult = evaluateCondition(node.condition, context);
    decisions.push({
      nodeId: currentId,
      condition: node.condition,
      result: condResult,
      reason: condResult
        ? `Yes: ${node.description}`
        : `No: Moving to next check`,
    });

    currentId = condResult ? (node.yesChild || '') : (node.noChild || '');
  }

  return { chosenAlgorithm, reason, expectedComplexity: complexity, traversalPath, decisions };
}

function evaluateCondition(condition: string, context: DecisionContext): boolean {
  switch (condition) {
    case 'Demand > Capacity?':
      return context.truckFull;
    case 'Single Destination?':
      return context.destinationCount === 1;
    case 'Destinations ≤ 8?':
      return context.destinationCount <= 8;
    case 'High Traffic?':
      return context.hasHighTraffic;
    default:
      return false;
  }
}

export function getDecisionTreeNodes(): DecisionTreeNode[] {
  return Array.from(decisionTreeNodes.values());
}

export function getDecisionTreeNodeById(id: string): DecisionTreeNode | undefined {
  return decisionTreeNodes.get(id);
}
