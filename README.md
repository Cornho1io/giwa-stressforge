# GIWA StressForge ⚒️

### One-Sentence Project Summary
An open-source, high-performance Node.js benchmarking framework designed to stress-test GIWA Chain's 1-second block time, Flashblocks pre-confirmations, and network throughput under high-concurrency synthetic load.

---

## 📢 Project Status: Active MVP Architecture
> **Note for GASOK Reviewers:** The core architecture, dynamic network detection, async batching, and latency benchmarking pipelines are fully functional. The tool natively measures inclusion latencies and exports structured performance analytics for node operators and Web3 developers.

---

## 💡 The Challenge & Solution

### The Challenge
GIWA Chain delivers an ultra-fast **1-second block time** and utilizes **Flashblocks** for near-instant, sub-second pre-confirmations. However, during high-concurrency ecosystem events (like genesis NFT mints or rapid DEX pool deployments), underlying RPC endpoints and local execution nodes (`giwa-io/node`) face heavy throughput strain. Developers lack a lightweight, native developer tool to stress-test and benchmark their infrastructures before transitioning to production.

### The Solution: GIWA StressForge
`GIWA StressForge` is a lightweight, zero-overhead benchmarking framework engineered natively in TypeScript/Node.js to push GIWA's architecture to its limits.

* ⚡ **Dynamic Network Auto-Discovery:** Automatically queries target RPCs for Chain ID verification to eliminate network transaction mismatches.
* 🔄 **Asynchronous Parallel Batch Engine:** Utilizes atomic nonce sequencing to broadcast concurrent transaction batches in parallel without mempool collisions.
* ⏱️ **E2E Inclusion Latency Tracking:** Measures exact millisecond metrics across broadcast RPC delays, block inclusion speeds, and gas execution overhead.
* 📊 **Automated Report Generation:** Automatically records benchmark performance runs into structured JSON reports for historical tracking and analysis.

---

## 🛠️ Technical Stack
* **Runtime Backend:** Node.js / TypeScript (Optimized for asynchronous event-loop handling and high-throughput network requests).
* **Web3 Integration:** Powered by `viem` to mirror GIWA's ecosystem tool requirements and ensure accurate L2 gas estimations.
* **Environment Configuration:** Managed via `dotenv` with full CLI argument overrides.

---

## 🚀 Quick Start Guide

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/giwa-stressforge.git
cd giwa-stressforge
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
GIWA_RPC_URL=https://sepolia-rpc.giwa.io
PRIVATE_KEY=0x_your_private_key_here
```

### 3. Execution Options

Run default pipeline (Single Tx + 5-Tx Parallel Batch):
```bash
npm run dev
```

Run custom batch size directly:
```bash
npm run dev 10
```

Run using CLI flags:
```bash
npm run dev -- --batch 20
```

---

## 📊 Exported Benchmark Reports

Upon successful pipeline execution, `GIWA StressForge` automatically saves execution metrics to `./reports/benchmark-report-<timestamp>.json`.

**Sample JSON Output:**
```json
{
  "timestamp": "2026-07-21T06:47:28.062Z",
  "network": {
    "chainId": 91342,
    "rpcUrl": "https://sepolia-rpc.giwa.io",
    "activeWallet": "0x6A72C706Db1B49727e8Ece33AD8d8A9BF1d3774e"
  },
  "singleTxBenchmark": {
    "txHash": "0xecab0f8b216f4aa59aa40d9f06ef06e4a79e3ec08d3d783bae641dccb8c595b7",
    "blockNumber": "31271327",
    "rpcBroadcastMs": 1914.17,
    "blockInclusionMs": 1789.75,
    "totalE2EMs": 3703.92,
    "gasUsed": "21000"
  },
  "batchBenchmark": {
    "batchSize": 5,
    "minedCount": 5,
    "successRatePercentage": 100,
    "totalBatchDurationMs": 3742.86,
    "averageRpcBroadcastMs": 1624.49,
    "minedInBlocks": ["31271330", "31271331"]
  }
}
```

---

## 📂 Repository Structure Overview
* `src/index.ts` - Core orchestration pipeline (network diagnostics, latency tracking, parallel worker engine, report exporter).
* `reports/` - Output directory containing generated JSON benchmark reports.
* `package.json` - Project metadata and execution scripts.
* `tsconfig.json` - Strict TypeScript compiler settings.

---

## 🚀 Future Roadmap & Mainnet Alignment
1. **Phase 1 (July 31):** Complete open-source CLI framework MVP for GASOK submission.
2. **Phase 2 (August):** Integrate real-time WebSocket listeners for native GIWA Flashblocks stream pre-confirmations.
3. **Phase 3 (September Mainnet):** Provide turnkey Docker-ready configurations for node operators running `giwa-io/node` to measure local node throughput post-genesis.

---

## 👥 Meet the Builder
* **Artem** — Lead Builder / Full-Stack & Web3 Developer. Specialized in building high-performance web automation engines, parallel backend scripts, and decentralized network tooling.