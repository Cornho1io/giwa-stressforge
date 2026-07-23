/**
 * Pre-compiled EVM Counter Contract
 * Contains ABI and Bytecode to avoid local compiler dependencies (solc/hardhat).
 */
export const COUNTER_ABI = [
  {
    inputs: [],
    name: "inc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "count",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Minimal EVM bytecode for counter increment contract
export const COUNTER_BYTECODE = "0x6080604052348015600f57600080fd5b5060ab8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c90506306661abd8114603757806337130ae0146055575b600080fd5b603d6061565b604051604c9190607f565b60405180910390f35b605b6070565b005b6000548114565b600054600101600055565b6000602082019050609283816075565b92915050f85b600081519050919050f85b600082825260208201905092915050f8" as `0x${string}`;