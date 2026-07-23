# GIWA StressForge ⚒️

### One-Sentence Project Summary
An open-source, high-performance Node.js benchmarking framework designed to stress-test GIWA Chain's 1-second block time, Flashblocks pre-confirmations, and RPC infrastructure under high-concurrency synthetic load.

---

## 📢 Project Status: Production-Ready CLI Engine
> **Note for GASOK Reviewers:** The framework features an interactive CLI profile selector, wallet balance awareness, automated EVM benchmark contract deployments, parallel RPC read-spam modules, rate-limit backoff resilience, and automated dual-export reporting (JSON + Interactive HTML Dashboard).

---

## 💡 Key Features & Architecture

* 💳 **Balance-Aware Pre-Flight Engine:** Automatically queries wallet ETH balance before profile selection and provides real-time gas fee estimates to prevent execution stalls.
* 📌 **Interactive Benchmark Profiles:** Includes pre-configured test suites (`LIGHT`, `FULL`, `MAX`) as well as a fully configurable `CUSTOM` mode.
* ⚡ **EVM & Native Transfer Load:** Deploys a lightweight benchmark contract (`Counter.sol`) and measures execution latencies across both EVM state mutations (`inc()`) and P2P transfers.
* ⚡ **Parallel RPC Read Spam:** Simulates concurrent heavy read queries (e.g., balance polling) alongside transactional stress to test RPC throughput limits.
* 🛡️ **Fault Tolerant & Resilient:** Equipped with dynamic EIP-1559 priority fee scaling, automated retry loops with exponential backoff for HTTP 429 rate limits, and non-crashing error boundary management.
* 📊 **Dual Report Exporter:** Automatically compiles execution metrics into both structured `.json` data files and visually rich `.html` dashboards with latency graphs.

---

## ⚙️ Benchmark Profiles

| Profile | Batch Size | EVM Contract Calls | Parallel Read Spam | Est. Balance Req. | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **LIGHT** | 10 Txs | ❌ No | ❌ No | ~0.0008 ETH | Quick self-transfer latency check (Default) |
| **FULL** | 25 Txs | ✅ Yes | ❌ No | ~0.0020 ETH | Mixed EVM contract calls & P2P transactions |
| **MAX** | 50 Txs | ✅ Yes | ✅ Yes | ~0.0040 ETH | High priority fee, EVM calls + RPC read stress |
| **CUSTOM** | User-defined | Configurable | Configurable | Dynamic | Manual control over tx count, fees, and EVM |

---

## 🛠️ Technical Stack
* **Runtime:** Node.js / TypeScript (ES2022 / CommonJS).
* **Ecosystem SDK:** Powered by `viem` for lightweight, precise EIP-1559 transaction construction and ABI encoding.
* **Environment Management:** `dotenv` configuration with strict private key protection.
* **Reporting:** Native HTML/CSS templating engine and filesystem JSON logger.

---

## 🚀 Quick Start Guide

### 1. Installation
Clone the repository and install dependencies:

git clone https://github.com/your-username/giwa-stressforge.git
cd giwa-stressforge
npm install

### 2. Environment Setup
Create a `.env` file in the root directory:

RPC_URL=https://sepolia-rpc.giwa.io
PRIVATE_KEY=0x_your_private_key_here

### 3. Execution
Launch the interactive CLI benchmark tool:

npm run dev

Upon launching, the interactive menu will display your current balance and prompt for a profile selection:

============================================================
💳 Wallet Balance : 0.0520 ETH
============================================================
📌 Select Benchmark Profile:
 1) LIGHT  | 10 Txs | Native Self-Transfers            | ~0.0008 ETH [DEFAULT]
 2) FULL   | 25 Txs | EVM Contract + Transfers         | ~0.0020 ETH
 3) MAX    | 50 Txs | EVM + Transfers + Read RPC Spam  | ~0.0040 ETH
 4) CUSTOM | Manual Configuration (Set your own parameters)
------------------------------------------------------------

Enter choice (1-4) [default: 1]:

---

## 📊 Exported Benchmark Reports

Reports are automatically generated and saved in the `./reports/` directory upon test completion.

* **JSON Report (`report-<timestamp>.json`):** Ideal for CI/CD integration, automated tracking, and programmatic ingestion.
* **HTML Dashboard (`report-<timestamp>.html`):** Standalone, browser-ready interactive dashboard featuring execution summary cards and latency visualization.

---

## 📂 Repository Structure Overview
* `src/index.ts` — Main CLI entrypoint, interactive profile engine, wallet pre-checks, rate-limit backoff handler, and transaction broadcaster.
* `src/contractData.ts` — EVM Benchmark Contract bytecodes and ABI definitions (`Counter`).
* `src/htmlReport.ts` — HTML Dashboard template builder.
* `reports/` — Output directory for JSON logs and HTML visual reports.
* `package.json` — Dependency management and execution scripts.
* `tsconfig.json` — Strict TypeScript compilation rules.

---

## 🚀 Future Roadmap & Mainnet Alignment
1. **Phase 1 (July 31):** Complete open-source CLI benchmark framework for GASOK submission.
2. **Phase 2 (August):** Integrate WebSocket subscriptions for sub-second GIWA Flashblock pre-confirmation timing.
3. **Phase 3 (September Mainnet):** Provide Docker-ready orchestration for node operators running `giwa-io/node` to measure local throughput.

---

## 👥 Meet the Builder
* **Artem** — Lead Builder / Full-Stack & Web3 Developer. Specialized in building high-performance web automation engines, parallel backend scripts, and decentralized network tooling.