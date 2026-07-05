/**
 * Binary Heap (Max Heap) based Priority Queue
 * Priority = FillPercentage + ComplaintCount + HospitalWeight + SchoolWeight + SmellScore
 * Operations: Insert, Delete, Heapify, ExtractMax
 * Data Structures: Binary Heap, Array
 * Complexity: O(log n) per operation
 */
import type { HeapStep } from '../../types';

export interface HeapItem {
  binId: number;
  priority: number;
  label: string;
}

export class MaxHeap {
  public heap: HeapItem[] = [];
  public steps: HeapStep[] = [];
  private recordSteps: boolean;

  constructor(recordSteps = false) {
    this.recordSteps = recordSteps;
  }

  private record(type: HeapStep['type'], indices: number[], description: string) {
    if (this.recordSteps) {
      this.steps.push({
        type,
        array: this.heap.map(h => h.priority),
        indices,
        description,
      });
    }
  }

  insert(item: HeapItem) {
    this.heap.push(item);
    this.record('insert', [this.heap.length - 1], `Insert Bin ${item.binId} (priority: ${item.priority.toFixed(1)})`);
    this.bubbleUp(this.heap.length - 1);
  }

  extractMax(): HeapItem | null {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const last = this.heap.pop()!;
    this.record('extract', [0], `Extract Max: Bin ${max.binId} (priority: ${max.priority.toFixed(1)})`);
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return max;
  }

  delete(index: number) {
    if (index >= this.heap.length) return;
    const item = this.heap[index];
    this.record('delete', [index], `Delete Bin ${item.binId} at index ${index}`);
    this.heap[index].priority = Infinity;
    this.bubbleUp(index);
    this.extractMax();
  }

  buildHeap(items: HeapItem[]) {
    this.heap = [...items];
    this.record('heapify', [], 'Building heap from array');
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.sinkDown(i);
    }
    this.record('heapify', [], 'Heap construction complete');
  }

  peek(): HeapItem | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  get size() { return this.heap.length; }

  getArray(): HeapItem[] { return [...this.heap]; }

  private bubbleUp(idx: number) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].priority >= this.heap[idx].priority) break;
      this.record('swap', [parent, idx],
        `Swap: Bin ${this.heap[idx].binId} ↑ Bin ${this.heap[parent].binId}`);
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private sinkDown(idx: number) {
    const length = this.heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < length && this.heap[left].priority > this.heap[largest].priority) largest = left;
      if (right < length && this.heap[right].priority > this.heap[largest].priority) largest = right;
      if (largest === idx) break;
      this.record('swap', [largest, idx],
        `Swap: Bin ${this.heap[idx].binId} ↓ Bin ${this.heap[largest].binId}`);
      [this.heap[largest], this.heap[idx]] = [this.heap[idx], this.heap[largest]];
      idx = largest;
    }
  }
}

// Priority calculation formula
export function calculateHeapPriority(node: {
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
