# Web Worker vs Main Thread Log Analyzer & Concurrency Benchmarker

This project is a high-performance, client-side log analyzer dashboard built with **React 19, TypeScript, Recharts, and Vanilla CSS**. The application is engineered to process and search through **50,000 log entries (~10MB JSON)** entirely in the browser.

The core focus of this project is to demonstrate the performance differences between executing heavy, synchronous data-processing tasks on the **Main JavaScript Thread** vs. offloading them to a background **Web Worker**, ensuring a smooth 60 FPS user experience.

---

## 🚀 Performance Benchmarking Concept

When querying large client-side datasets, operations like scanning 50,000 entries, tokenizing keywords, calculating distribution timelines, and computing metrics are CPU-heavy. To showcase the impact of thread blocking:

- **Fixed Benchmark Complexity**: Every search query executes exactly **60 iterations** of the search/aggregation pipeline (equivalent to processing **3,000,000 log lines**).
- **Web Worker Mode**: The 60-iteration workload is offloaded to a background thread. As you type, the search logic executes in the background. The main thread remains completely idle, maintaining a perfect **60 FPS** UI frame rate.
- **Main Thread Mode**: The 60-iteration workload is executed directly on the UI thread. The main thread blocks for **150ms–350ms** on every single keypress, dropping the frame rate to **~4 FPS** and freezing all animations and keystrokes.

---

## 🧠 Deep Dive: What is a Web Worker & How It Works?

### 1. The Single-Threaded Nature of JavaScript

By default, web browsers run JavaScript on a single thread—the **Main Thread** (often called the UI thread). This thread is responsible for:

1.  Running JavaScript code.
2.  Handling user inputs (clicks, keypresses, scrolls).
3.  Calculating CSS layouts and painting pixels on the screen.
4.  Executing animation frames (striving for a constant 60Hz/140Hz VSync rate).

Because everything runs on this single thread, if a synchronous block of JavaScript code takes a long time to run (e.g., filtering 50,000 logs 60 times), it blocks the entire thread. While the script runs, the browser **cannot** respond to user input, update animations, or paint the screen. This is known as **Thread Blocking** or **UI Freezing**.

### 2. What is a Web Worker?

A **Web Worker** is a standard browser feature that allows you to run JavaScript files in the background, entirely separate from the Main Thread.

- **True Parallelism**: Web Workers run on separate OS-level threads.
- **Independent Context**: A Web Worker runs in a different global scope (`DedicatedWorkerGlobalScope`) instead of the main `window` scope. It runs its own event loop.

### 3. How Web Workers Communicate (The Messaging Model)

Since Web Workers run in an isolated environment, they cannot share memory variables directly with the Main Thread (unlike multi-threaded languages like C++ or Java, which share variables and require complex thread synchronization locks).

Instead, they communicate using an asynchronous **Message-Passing Model**:

```
+--------------------------+                  +--------------------------+
|       MAIN THREAD        |                  |    WEB WORKER THREAD     |
|   (UI, React, DOM)       |                  |   (CPU-Heavy Analysis)   |
|                          |                  |                          |
|  worker.postMessage()  =======[Copy]=======>|      self.onmessage      |
|  (Send search query)     |                  |   (Process log filters)  |
|                          |                  |                          |
|    worker.onmessage    <======[Copy]========|    self.postMessage()    |
|   (Receive results)      |                  |  (Return results pages)  |
+--------------------------+                  +--------------------------+
```

- **`postMessage(data)`**: Sends a message (data payload) to the other thread.
- **`onmessage`**: Registers an event listener to handle incoming messages from the other thread.

### 4. Data Transfer: The Structured Clone Algorithm

When you send data via `postMessage()`, the browser does not pass a reference to the original object (which would lead to race conditions if both threads mutated it). Instead, it uses the **Structured Clone Algorithm** to serialize the data, copy it across the thread boundary, and deserialize it on the other side.

- _Note_: For massive datasets (e.g., 50MB+), the serialization and copying overhead can introduce micro-stutters on the main thread. In this project, we optimize this by **caching the 50,000 logs in the worker's memory once** on mount (`INGEST` event). Subsequent query requests only pass a tiny `QueryObject` (~200 bytes), making the transfer cost virtually zero.

### 5. Limitations of Web Workers

Because Web Workers run in a fully isolated global context, they do **not** have access to:

- **The DOM**: A worker cannot query elements (`document.getElementById`) or update the UI directly. All UI updates must be sent back to the Main Thread via `postMessage` so React can render them.
- **The Window Object**: Workers cannot access `window.localStorage`, `window.location`, or global variables declared on the main thread.
- **Synchronous UI Interaction**: A worker cannot call `alert()`, `confirm()`, or perform synchronous DOM measurements.

---

## ⚡ Technical Optimizations

### 1. Memoized Database Serialization (`useMemo` Optimization)

A common pitfall in data-heavy React dashboards is executing expensive serialization during rendering. In early iterations, the database size was calculated on every render using:

```typescript
const estimatedSizeMb = (
  JSON.stringify(allLogs).length /
  (1024 * 1024)
).toFixed(1);
```

Since React renders on every keystroke, this stringified 50,000 logs (~10MB) on the Main Thread for every letter typed, introducing a mandatory **60ms–90ms freeze** regardless of the thread mode.

- **Solution**: Wrapped the calculation in `useMemo` with `allLogs` as the sole dependency. It now executes exactly **once** on ingestion, freeing the input field to type at maximum speed.

### 2. Active Web Worker Cancellation (Abort Pattern)

When typing rapidly without a debouncer (e.g. typing `error` triggers 5 sequential requests: `e`, `er`, `err`, `erro`, `error`), a background worker can get backlogged executing obsolete intermediate queries. This queue buildup causes results to arrive seconds late and forces React to render multiple obsolete UI updates.

- **Solution**: If a query is in progress (`isQuerying === true`) when a new key is pressed, the main thread immediately calls `worker.terminate()` to abort the worker mid-flight. It then spins up a fresh worker and re-ingests the data (~8-12ms overhead). This immediately cancels the obsolete query, prevents backlog, and delivers the final result instantly.

### 3. Conditional Complexity for Page Navigation

While search queries require heavy filtering and aggregation (60 iterations), simple page changes (clicking "Next Page") do not modify the query filter rules.

- **Solution**: Cached previous search parameters in a `useRef`. If only page navigation or line limit changes occur, the query runs exactly **1 iteration** (takes `<2ms`), making page switches instantaneous in both Main and Worker modes.

---

## 📂 Project Architecture & Codebase Split

The codebase has been refactored into a highly modular, maintainable structure:

```
src/
├── components/
│   ├── TelemetryCard.tsx   # Query modes, live FPS avg/min, query timers, and lag simulation
│   ├── MetricsCard.tsx     # Incident counts (Matched, Errors, Warns) and progress rate bar
│   ├── FilterCard.tsx      # Keyword filters, severity dropdowns, and time presets
│   ├── TimelineChart.tsx   # Stacked Bar Chart (Recharts) with custom tooltips
│   └── LogExplorer.tsx     # Log stream table grid, custom keyword highlighting, and pager
├── analysisLog.ts          # Pure function processing filtering, timeline, and metrics
├── analysisWorker.ts       # Web Worker script caching logs in memory & executing loops
├── mockData.ts             # Deterministic generator yielding 50k realistic logs
├── types.ts                # Shared TypeScript types for query parameters and responses
└── App.tsx                 # Parent component orchestrating state and worker lifecycle
```

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/MiladSadeghi/webworker-vs-main-thread
   cd project
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build the production bundle:
   ```bash
   npm run build
   ```
