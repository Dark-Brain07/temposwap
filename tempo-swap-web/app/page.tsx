'use client';

import { useState } from 'react';
import { ArrowDownUp, Settings, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS, ROUTER_ABI, ERC20_ABI, STABLECOINS } from '@/constants/contracts';

export default function Home() {
  // Swap Direction: true = Base -> Custom, false = Custom -> Base
  const [isBaseToCustom, setIsBaseToCustom] = useState(true);

  // Token State
  const [baseToken, setBaseToken] = useState<keyof typeof STABLECOINS>('ThetaUSD');
  const [customTokenAddress, setCustomTokenAddress] = useState('');

  // Amounts
  const [amountIn, setAmountIn] = useState('');

  const { address: userAddress, isConnected } = useAccount();

  const baseTokenAddress = STABLECOINS[baseToken];

  // Read Custom Token
  const { data: customSymbol } = useReadContract({
    address: customTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!customTokenAddress && customTokenAddress.length === 42 }
  });

  const { data: customDecimals } = useReadContract({
    address: customTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!customTokenAddress && customTokenAddress.length === 42 }
  });

  const baseDecimals = 18;
  const activeDecimals = isBaseToCustom ? baseDecimals : customDecimals || 18;

  // APPROVE
  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isApproveLoading, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });

  // SWAP
  const { writeContract: writeSwap, data: swapHash, isPending: isSwapping, error: swapError } = useWriteContract();
  const { isLoading: isSwapLoading, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });

  const handleApprove = () => {
    if (!amountIn) return;
    const tokenToApprove = isBaseToCustom ? baseTokenAddress : customTokenAddress;
    const amount = parseUnits(amountIn, activeDecimals);

    writeApprove({
      address: tokenToApprove as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.ROUTER, amount],
    });
  };

  const handleSwap = () => {
    if (!customTokenAddress || !amountIn) return;
    const amount = parseUnits(amountIn, activeDecimals);
    const deadline = 9999999999n; // Far future

    const path = isBaseToCustom
      ? [baseTokenAddress, customTokenAddress]
      : [customTokenAddress, baseTokenAddress];

    writeSwap({
      address: CONTRACTS.ROUTER as `0x${string}`,
      abi: ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        amount,
        0n, // Min Amount Out (Slippage 100%)
        path as `0x${string}`[],
        userAddress as `0x${string}`,
        deadline
      ],
      gas: 2000000n,
    });
  };

  const flipDirection = () => {
    setIsBaseToCustom(!isBaseToCustom);
    setAmountIn(''); // Reset amount on flip to avoid confusion
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Swap</h2>
          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
            <Settings size={20} />
          </button>
        </div>

        {/* INPUT 1 (PAY) */}
        <div className="bg-slate-950/50 p-4 rounded-2xl mb-1 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400 text-sm">You pay</span>
          </div>
          <div className="flex items-center gap-4">
            {isBaseToCustom ? (
              <select
                value={baseToken}
                onChange={(e) => setBaseToken(e.target.value as keyof typeof STABLECOINS)}
                className="bg-slate-900 text-white p-2 rounded-lg outline-none border border-slate-700"
              >
                {Object.keys(STABLECOINS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            ) : (
              <div className="flex flex-col flex-1">
                <input
                  placeholder="Token Address"
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                  className="bg-transparent text-xs text-slate-400 mb-1 outline-none font-mono"
                />
                <span className="text-white font-bold">{customSymbol || 'CUSTOM'}</span>
              </div>
            )}
            <input
              type="number"
              placeholder="0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder-slate-600 text-right"
            />
          </div>
        </div>

        {/* SWAP ARROW */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={flipDirection}
            className="bg-slate-800 border-4 border-slate-900 p-2 rounded-xl text-cyan-400 hover:text-white hover:bg-slate-700 transition-all hover:scale-110"
          >
            <ArrowDownUp size={20} />
          </button>
        </div>

        {/* INPUT 2 (RECEIVE) */}
        <div className="bg-slate-950/50 p-4 rounded-2xl mt-1 mb-6 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400 text-sm">You receive (Estimated)</span>
          </div>
          <div className="flex items-center gap-4">
            {!isBaseToCustom ? (
              <select
                value={baseToken}
                onChange={(e) => setBaseToken(e.target.value as keyof typeof STABLECOINS)}
                className="bg-slate-900 text-white p-2 rounded-lg outline-none border border-slate-700"
              >
                {Object.keys(STABLECOINS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            ) : (
              <div className="flex flex-col flex-1">
                <input
                  placeholder="Token Address"
                  value={customTokenAddress}
                  onChange={(e) => setCustomTokenAddress(e.target.value)}
                  className="bg-transparent text-xs text-slate-400 mb-1 outline-none font-mono"
                />
                <span className="text-white font-bold">{customSymbol || 'CUSTOM'}</span>
              </div>
            )}
            <div className="text-3xl font-bold text-slate-500 w-full text-right pointer-events-none opacity-50">
              ---
            </div>
          </div>
        </div>

        {swapError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
            {swapError.message.split('Request')[0]}
          </div>
        )}

        {isSwapSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4 text-center">
            Swap Successful!
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={isApproved || isApproving || isApproveLoading || !amountIn || !customTokenAddress}
            className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2
                     ${isApproved
                ? 'bg-green-500/20 text-green-400 cursor-default hidden'
                : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          >
            {isApproving || isApproveLoading ? <Loader2 className="animate-spin" /> : '1. Approve Spending'}
          </button>

          <button
            onClick={handleSwap}
            disabled={!isApproved || isSwapping || isSwapLoading || !amountIn}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSwapping || isSwapLoading ? <Loader2 className="animate-spin" /> : 'Swap'}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
