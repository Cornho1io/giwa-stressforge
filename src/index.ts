import 'dotenv/config';
import { createPublicClient, createWalletClient, http, parseGwei, defineChain, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Модули проекта
import { COUNTER_ABI, COUNTER_BYTECODE } from './contractData';
import { generateHtmlReport } from './htmlReport';

// RPC & Auth Setup
const RPC_URL = process.env.RPC_URL || 'https://sepolia-rpc.giwa.io';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY is not defined in .env file.');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

function parseShortError(err: any): string {
  if (err?.shortMessage) return err.shortMessage;
  if (err?.details) return err.details;
  const firstLine = (err?.message || 'Unknown error').split('\n')[0];
  return firstLine.replace(/^Error:\s*/, '');
}

interface ExecutionConfig {
  profileName: string;
  txCount: number;
  enableEVM: boolean;
  enableReadSpam: boolean;
  minPriorityFeeGwei: number;
  maxPriorityFeeGwei: number;
}

interface TxResult {
  success: boolean;
  hash?: `0x${string}`;
  duration: number;
  blockNumber: number;
  error?: string;
}

/**
 * Interactive Profile Selector with Balance Awareness
 */
async function getExecutionConfig(currentBalanceEth: string): Promise<ExecutionConfig> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  console.log('============================================================');
  console.log(`💳 Wallet Balance : ${currentBalanceEth} ETH`);
  console.log('============================================================');
  console.log('📌 Select Benchmark Profile:');
  console.log(' 1) LIGHT  | 10 Txs | Native Self-Transfers            | ~0.0008 ETH [DEFAULT]');
  console.log(' 2) FULL   | 25 Txs | EVM Contract + Transfers         | ~0.0020 ETH');
  console.log(' 3) MAX    | 50 Txs | EVM + Transfers + Read RPC Spam  | ~0.0040 ETH');
  console.log(' 4) CUSTOM | Manual Configuration (Set your own parameters)');
  console.log('------------------------------------------------------------');

  const answer = await question('\nEnter choice (1-4) [default: 1]: ');
  const choice = answer.trim() || '1';

  if (choice === '2') {
    rl.close();
    return {
      profileName: 'FULL',
      txCount: 25,
      enableEVM: true,
      enableReadSpam: false,
      minPriorityFeeGwei: 1.0,
      maxPriorityFeeGwei: 3.0,
    };
  } else if (choice === '3') {
    rl.close();
    return {
      profileName: 'MAX',
      txCount: 50,
      enableEVM: true,
      enableReadSpam: true,
      minPriorityFeeGwei: 2.0,
      maxPriorityFeeGwei: 5.0,
    };
  } else if (choice === '4') {
    console.log('\n⚙️ Custom Profile Setup:');
    const txCountStr = await question('• Number of transactions [default: 20]: ');
    const evmStr = await question('• Enable EVM Contract Calls? (y/n) [default: y]: ');
    const readSpamStr = await question('• Enable Parallel Read Spam? (y/n) [default: n]: ');
    const minFeeStr = await question('• Min Priority Fee Gwei [default: 1.0]: ');
    const maxFeeStr = await question('• Max Priority Fee Gwei [default: 3.0]: ');
    rl.close();

    const txCount = parseInt(txCountStr) || 20;
    const estimatedCost = (txCount * 0.00008).toFixed(4);
    console.log(`\n💡 Estimated requirement for CUSTOM (${txCount} txs): ~${estimatedCost} ETH`);

    return {
      profileName: 'CUSTOM',
      txCount,
      enableEVM: evmStr.toLowerCase() !== 'n',
      enableReadSpam: readSpamStr.toLowerCase() === 'y',
      minPriorityFeeGwei: parseFloat(minFeeStr) || 1.0,
      maxPriorityFeeGwei: parseFloat(maxFeeStr) || 3.0,
    };
  } else {
    rl.close();
    return {
      profileName: 'LIGHT',
      txCount: 10,
      enableEVM: false,
      enableReadSpam: false,
      minPriorityFeeGwei: 0.1,
      maxPriorityFeeGwei: 0.5,
    };
  }
}

async function main() {
  const giwaChain = defineChain({
    id: 91342,
    name: 'GIWA Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
    blockExplorers: {
      default: { name: 'Explorer', url: 'https://sepolia-explorer.giwa.io' },
    },
  });

  const publicClient = createPublicClient({ chain: giwaChain, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, chain: giwaChain, transport: http(RPC_URL) });

  // 1. Сначала запрашиваем баланс
  const balance = await publicClient.getBalance({ address: account.address });
  const formattedBalance = formatEther(balance);

  // 2. Передаем баланс в меню выбора
  const config = await getExecutionConfig(formattedBalance);

  console.log(`\n🚀 Starting StressForge Benchmark...`);
  console.log(`• Target RPC   : ${RPC_URL}`);
  console.log(`• Account      : ${account.address}`);
  console.log(`• Profile      : ${config.profileName}`);
  console.log(`• Batch Size   : ${config.txCount} txs\n`);

  const estimatedRequiredETH = config.txCount * 0.00008;
  const isLowBalance = Number(formattedBalance) < estimatedRequiredETH;

  if (isLowBalance) {
    console.warn(`⚠️  WARNING: Low ETH balance (${formattedBalance} ETH).`);
    console.warn(`💡 Required approx ~${estimatedRequiredETH.toFixed(4)} ETH for profile ${config.profileName}.`);
    console.warn(`👉 Please top up target account via GIWA Sepolia Faucet if transactions fail.\n`);
  }

  const startTotalTime = Date.now();

  const feeData = await publicClient.estimateFeesPerGas().catch(() => null);
  const baseMaxFee = feeData?.maxFeePerGas || parseGwei('2');

  if (config.enableReadSpam) {
    console.log(`⚡ Launching parallel READ-heavy RPC queries...`);
    Promise.all(Array.from({ length: 10 }).map(() => publicClient.getBalance({ address: account.address }))).catch(() => {});
  }

  let deployedContractAddress: `0x${string}` | null = null;
  if (config.enableEVM) {
    console.log(`🛠️ Deploying EVM Benchmark Contract...`);
    try {
      const deployNonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: 'pending',
      });

      const deployHash = await walletClient.deployContract({
        abi: COUNTER_ABI,
        bytecode: COUNTER_BYTECODE,
        nonce: deployNonce,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash, timeout: 25_000 });
      deployedContractAddress = receipt.contractAddress || null;
      console.log(`✅ EVM Contract Deployed at: ${deployedContractAddress}`);
    } catch (e: any) {
      const errReason = isLowBalance ? 'Insufficient ETH balance for deployment fee' : parseShortError(e);
      console.warn(`⚠️ Contract deployment skipped (${errReason}), falling back to self-transfers.`);
    }
  }

  const pendingNonce = await publicClient.getTransactionCount({
    address: account.address,
    blockTag: 'pending',
  });
  const latestNonce = await publicClient.getTransactionCount({
    address: account.address,
    blockTag: 'latest',
  });
  let baseNonce = Math.max(pendingNonce, latestNonce);

  console.log(`📦 Broadcasting batch of ${config.txCount} transactions starting from Nonce #${baseNonce}...`);
  const txPromises: Promise<TxResult>[] = [];

  for (let i = 0; i < config.txCount; i++) {
    const txNonce = baseNonce + i;

    const randomGwei = config.minPriorityFeeGwei + Math.random() * (config.maxPriorityFeeGwei - config.minPriorityFeeGwei);
    const initialPriorityFee = parseGwei(randomGwei.toFixed(3));
    const initialMaxFee = baseMaxFee + initialPriorityFee;

    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    const sendTx = async (attempt = 1): Promise<TxResult> => {
      const txStart = Date.now();
      let hash: `0x${string}`;

      const multiplier = Math.pow(1.35, attempt - 1);
      const priorityFee = parseGwei((Number(initialPriorityFee) / 1e9 * multiplier).toFixed(4));
      const maxFeePerGas = parseGwei((Number(initialMaxFee) / 1e9 * multiplier).toFixed(4));

      try {
        if (deployedContractAddress && i % 2 === 0) {
          hash = await walletClient.writeContract({
            address: deployedContractAddress,
            abi: COUNTER_ABI,
            functionName: 'inc',
            nonce: txNonce,
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: maxFeePerGas,
            gas: 100_000n,
          });
        } else {
          hash = await walletClient.sendTransaction({
            to: account.address,
            value: 0n,
            nonce: txNonce,
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: maxFeePerGas,
            gas: 21_000n,
          });
        }

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 20_000,
        });

        return {
          success: true,
          hash,
          duration: Date.now() - txStart,
          blockNumber: Number(receipt.blockNumber),
        };
      } catch (err: any) {
        const shortErr = parseShortError(err);

        if ((shortErr.includes('rate limit') || shortErr.includes('429')) && attempt <= 5) {
          const backoff = 1000 * attempt + Math.floor(Math.random() * 500);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          return sendTx(attempt + 1);
        }

        if ((shortErr.includes('underpriced') || shortErr.includes('replacement')) && attempt <= 4) {
          return sendTx(attempt + 1);
        }

        if (shortErr.includes('nonce too low') || shortErr.includes('lower than the current nonce')) {
          return {
            success: true,
            hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            duration: Date.now() - txStart,
            blockNumber: 0,
          };
        }

        const finalErrorMsg = (shortErr.includes('Missing or invalid parameters') && isLowBalance)
          ? 'Insufficient ETH balance for gas fees'
          : shortErr;

        return {
          success: false,
          duration: Date.now() - txStart,
          blockNumber: 0,
          error: finalErrorMsg,
        };
      }
    };

    txPromises.push(sendTx());
  }

  const results = await Promise.all(txPromises);
  const totalDurationMs = Date.now() - startTotalTime;

  const successful = results.filter((r) => r.success);
  const failedCount = results.length - successful.length;

  const latencies = successful.map((s) => s.duration);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const minLatency = latencies.length ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length ? Math.max(...latencies) : 0;
  const blocksCovered = Array.from(new Set(successful.map((s) => s.blockNumber))).filter((b) => b > 0);

  console.log('\n============================================================');
  console.log(`📊 STRESSFORGE EXECUTION SUMMARY [Profile: ${config.profileName}]`);
  console.log('============================================================');
  console.log(`• Total Execution Time : ${totalDurationMs.toFixed(2)} ms`);
  console.log(`• Success Rate         : ${successful.length}/${config.txCount} Txs Mined (${failedCount} failed)`);
  console.log(`• Avg Latency          : ${avgLatency.toFixed(2)} ms (Min: ${minLatency}ms / Max: ${maxLatency}ms)`);
  console.log(`• Blocks Covered       : #${blocksCovered.length > 0 ? blocksCovered.join(', #') : 'N/A'}`);
  if (failedCount > 0) {
    const sampleError = results.find((r) => !r.success)?.error;
    console.log(`• Primary Failure Cause: ${sampleError}`);
  }
  console.log('------------------------------------------------------------');

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDir, `report-${timestamp}.json`);
  const htmlPath = path.join(reportsDir, `report-${timestamp}.html`);

  const reportData = {
    timestamp: new Date().toLocaleString(),
    profile: config.profileName,
    totalDurationMs,
    totalTxsSent: config.txCount,
    successfulTxs: successful.length,
    failedTxs: failedCount,
    avgLatencyMs: avgLatency,
    minLatencyMs: minLatency,
    maxLatencyMs: maxLatency,
    blocksCovered,
    latencies,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
  generateHtmlReport(reportData, htmlPath);

  console.log(`📂 Saved JSON Report : ./reports/report-${timestamp}.json`);
  console.log(`📂 Saved HTML Report : ./reports/report-${timestamp}.html`);
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error(`\n❌ Benchmark execution error: ${parseShortError(err)}\n`);
  process.exit(1);
});