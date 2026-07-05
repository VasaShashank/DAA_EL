# Smart Waste Optimizer — Demonstration Guide

This guide outlines a step-by-step procedure to demonstrate the full capabilities of the **Smart Waste Optimizer** console for evaluations, presentations, or grading viva sessions.

---

## 📍 Scenario 1: Main City Dashboard & Simulation
**Goal:** Show real-time telemetry, priority calculation, and automated scheduling heuristics.

1. **Access Dashboard**: Navigate to the default `/` (Dashboard) page.
2. **Generate City**:
   - Locate the **Bins input field** in the top bar. Enter a value (e.g., `12`) and click **Generate**.
   - Note the immediate generation of a fully connected graph network.
3. **Run Simulation**:
   - Click the **Start** button in the top bar. Bins will begin accumulating waste based on their growth rates.
   - Adjust the speed slider next to it (`2x` or `5x`) to accelerate time.
   - Observe the **Priority Queue (Max Heap)** table on the left updates dynamically using the multi-variable priority score.
4. **Trigger Emergency**:
   - Double-click any partially filled bin on the active map.
   - Note that it instantly flashes red (forced to $100\%$ capacity), and a truck is scheduled to service it.

---

## 🛣️ Scenario 2: Dijkstra Pathfinding Visualizer
**Goal:** Show academic step-by-step pathfinding and Heap data structures.

1. **Access Page**: Navigate to the **Dijkstra** tab in the sidebar.
2. **Select Nodes**:
   - Click any node on the map to set it as the **Start** node (marked in green).
   - Click another node to set it as the **End** node (marked in red).
3. **Execute and Animate**:
   - Click **Run Dijkstra**.
   - Click **Play** on the playback controls. Slide the speed bar to `10x` to fast-forward through states.
   - Observe:
     - The code lines highlighting matching steps.
     - The priority queue array list displaying visited weights.
     - The path highlight rendering on the map at the final step.

---

## 🌳 Scenario 3: Decision Tree Selector
**Goal:** Show how the system selects algorithms based on workload constraints.

1. **Access Page**: Navigate to the **Decision Tree** tab.
2. **Demonstrate Traversal Paths**:
   - **Case A (Knapsack)**: Toggle the **Truck Full?** parameter to `Yes`. Click **Traverse**. Watch the green traversal line flow from root directly to `0/1 Knapsack`.
   - **Case B (Dijkstra)**: Set **Truck Full?** to `No` and **Destinations** to `1`. Click **Traverse**. Observe it selecting `Dijkstra's Algorithm`.
   - **Case C (Branch & Bound)**: Set **Truck Full?** to `No`, **Destinations** to `5`, and **High Traffic?** to `No`. Traverse to see it choose `Branch & Bound TSP`.
   - **Case D (Nearest Neighbor)**: Increase **Destinations** to `12`. Traverse to see it fall back to `Greedy Nearest Neighbor`.

---

## 📦 Scenario 4: 0/1 Knapsack Optimizer
**Goal:** Demonstrate Dynamic Programming table population.

1. **Access Page**: Navigate to the **Knapsack** tab.
2. **Configure Capacity**: Set the **Capacity** parameter in the top bar to `400` or `500` kg.
3. **Execute Table Build**:
   - Click **Run Knapsack**.
   - Click **Play** and slide the playback speed up to `10x` to animate the DP grid cells.
   - Cells show the max value comparison bottom-up. Green highlights cells where items are included; orange highlights exclusions.

---

## ⛑️ Scenario 5: Road Failure & Rerouting
**Goal:** Demonstrate network connectivity verification (BFS/DFS) and real-time rerouting.

1. **Access Page**: Navigate to the **Road Failure** tab.
2. **Simulate Failures**:
   - Click the **Random Failure** button. Roads will turn red with an **✕** mark.
   - Observe the **Connectivity Status** box update (e.g. *"Graph DISCONNECTED! 2 components found"*).
3. **Recalculate Paths**:
   - Toggle to **🔍 Set Route** in the top bar.
   - Click a target node to route to, then click **Find Route**.
   - Observe the new path bypass the blocked roads. If the road blocks isolate a node, the status box will warn that no route is physically possible.

---

## 📈 Scenario 6: Carbon & Performance Dashboards
**Goal:** Show ecological and execution benchmarks.

1. **Carbon Dashboard**:
   - Observe the metrics comparison table (Shortest Distance vs. Traffic-Aware vs. Lowest Fuel vs. Lowest Carbon).
   - Toggle the **Optimize for** options (Distance, Fuel, Carbon, Time) in the header and check that the **`BEST`** badge updates to the optimized route.
2. **Performance Dashboard**:
   - Look at the comparative charts showing execution speed (in ms), memory footprint (in KB), and count of nodes explored.
   - Real-time runs from Dijkstra, TSP, and Knapsack tabs populate these logs automatically.
