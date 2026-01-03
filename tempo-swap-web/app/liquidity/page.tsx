'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, Droplets, Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, ROUTER_ABI, ERC20_ABI, STABLECOINS } from '@/constants/contracts';

export default function Liquidity() {
    const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');

    // Selection
    const [baseToken, setBaseToken] = useState<keyof typeof STABLECOINS>('ThetaUSD');
    const [customTokenAddress, setCustomTokenAddress] = useState('');

    // Amounts
    const [baseAmount, setBaseAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    const { address: userAddress, isConnected } = useAccount();

    const baseTokenAddress = STABLECOINS[baseToken];

    // Read Custom Token Details
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

    // Base Token Decimals (Usually 18, but good to check or assume 18 for now)
    const baseDecimals = 18;

    // --- APPROVALS ---
    // Force re-read of allowance to ensure UI updates after contract change
    const { data: allowanceBase, refetch: refetchBaseAllowance } = useReadContract({
        address: baseTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, CONTRACTS.ROUTER],
        query: { enabled: !!userAddress },
    });

    const { data: allowanceCustom, refetch: refetchCustomAllowance } = useReadContract({
        address: customTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, CONTRACTS.ROUTER],
        query: { enabled: !!userAddress && !!customTokenAddress },
    });

    const { writeContract: writeApproveBase, data: approveBaseHash, isPending: isApprovingBase } = useWriteContract();
    const { isLoading: isBaseApproveLoading, isSuccess: isBaseApprovedTx } = useWaitForTransactionReceipt({ hash: approveBaseHash });

    const { writeContract: writeApproveCustom, data: approveCustomHash, isPending: isApprovingCustom } = useWriteContract();
    const { isLoading: isCustomApproveLoading, isSuccess: isCustomApprovedTx } = useWaitForTransactionReceipt({ hash: approveCustomHash });

    // dervied state for UI
    const isBaseApproved = (allowanceBase && baseAmount) ? allowanceBase >= parseUnits(baseAmount, baseDecimals) : false;
    const isCustomApproved = (allowanceCustom && customAmount) ? allowanceCustom >= parseUnits(customAmount, customDecimals || 18) : false;

    // Refetch allowances after tx confirmation
    if (isBaseApprovedTx) refetchBaseAllowance();
    if (isCustomApprovedTx) refetchCustomAllowance();

    // --- ADD LIQUIDITY ---
    const { writeContract: writeLiquidity, data: liquidityHash, isPending: isAdding, error: liquidityError } = useWriteContract();
    const { isLoading: isAddingLoading, isSuccess: isLiquidityAdded } = useWaitForTransactionReceipt({ hash: liquidityHash });

    const handleApproveBase = () => {
        if (!baseAmount) return;
        const amount = parseUnits(baseAmount, baseDecimals);
        writeApproveBase({
            address: baseTokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.ROUTER, amount],
        });
    };

    const handleApproveCustom = () => {
        if (!customTokenAddress || !customAmount) return;
        const amount = parseUnits(customAmount, customDecimals || 18);
        writeApproveCustom({
            address: customTokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.ROUTER, amount],
        });
    };

    const handleAddLiquidity = () => {
        if (!customTokenAddress || !customAmount || !baseAmount) return;
        const amountBase = parseUnits(baseAmount, baseDecimals);
        const amountCustom = parseUnits(customAmount, customDecimals || 18);

        // Deadline: Year 2286 (Hardcoded to bypass massive Testnet clock skew)
        const deadline = 9999999999n;

        writeLiquidity({
            address: CONTRACTS.ROUTER as `0x${string}`,
            abi: ROUTER_ABI,
            functionName: 'addLiquidity',
            args: [
                baseTokenAddress as `0x${string}`,
                customTokenAddress as `0x${string}`,
                amountBase,
                amountCustom,
                0n, // Min Base
                0n, // Min Custom
                userAddress as `0x${string}`,
                deadline
            ],
            gas: 9000000n, // Force VERY high gas limit for pair creation
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10"
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Droplets className="text-cyan-400" />
                        Liquidity
                    </h2>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'add' ? 'bg-cyan-900/30 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setActiveTab('remove')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'remove' ? 'bg-pink-900/30 text-pink-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            Remove
                        </button>
                    </div>
                </div>

                {activeTab === 'add' ? (
                    <div className="space-y-4">

                        {/* Visual Guide */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-xl border border-dashed border-slate-700 mb-6">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700 text-[10px]">{baseToken.slice(0, 1)}</div>
                            <Plus className="text-slate-600" size={16} />
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700 text-[10px]">{customSymbol?.slice(0, 1) || '?'}</div>
                            <Layers className="text-slate-600" size={16} />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg text-[10px]">LP</div>
                        </div>

                        {/* Base Token Input */}
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                            <div className="flex justify-between mb-2">
                                <select
                                    value={baseToken}
                                    onChange={(e) => setBaseToken(e.target.value as keyof typeof STABLECOINS)}
                                    className="bg-transparent text-slate-400 text-sm font-medium outline-none cursor-pointer hover:text-white"
                                >
                                    {Object.keys(STABLECOINS).map(key => (
                                        <option key={key} value={key} className="bg-slate-900">{key}</option>
                                    ))}
                                </select>
                                <span className="text-slate-600 text-xs truncate max-w-[120px]">{baseTokenAddress.slice(0, 6)}...{baseTokenAddress.slice(-4)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={baseAmount}
                                    onChange={(e) => setBaseAmount(e.target.value)}
                                    className="bg-transparent text-2xl font-bold text-white outline-none w-full placeholder-slate-600"
                                />
                                <span className="text-lg font-bold text-slate-500">{baseToken}</span>
                            </div>
                        </div>

                        <div className="flex justify-center -my-2">
                            <Plus className="text-slate-600 bg-slate-900 rounded-full p-1 border border-slate-800" size={24} />
                        </div>

                        {/* Custom Token Input */}
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                            <div>
                                <label className="text-slate-500 text-xs uppercase font-bold tracking-wider">Token Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={customTokenAddress}
                                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                                    className="bg-slate-900 w-full rounded-lg px-3 py-2 text-sm text-slate-300 outline-none border border-slate-800 focus:border-cyan-500 transition-colors mt-1"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className="bg-transparent text-2xl font-bold text-white outline-none w-full placeholder-slate-600"
                                />
                                <span className="text-lg font-bold text-slate-500">{customSymbol || 'TOKEN'}</span>
                            </div>
                        </div>

                        {liquidityError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {liquidityError.message.split('Request')[0]}
                            </div>
                        )}

                        {isLiquidityAdded && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Liquidity Added!
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {/* APPROVE BASE */}
                            <button
                                onClick={handleApproveBase}
                                disabled={isBaseApproved || isApprovingBase || isBaseApproveLoading || !baseAmount}
                                className={`font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-1 text-sm
                            ${isBaseApproved
                                        ? 'bg-green-500/20 text-green-400 cursor-default'
                                        : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                            >
                                {isApprovingBase || isBaseApproveLoading ? <Loader2 className="animate-spin" size={16} /> :
                                    isBaseApproved ? `Approve ${baseToken} ✓` : `Approve ${baseToken}`}
                            </button>

                            {/* APPROVE CUSTOM */}
                            <button
                                onClick={handleApproveCustom}
                                disabled={isCustomApproved || isApprovingCustom || isCustomApproveLoading || !customTokenAddress || !customAmount}
                                className={`font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-1 text-sm
                             ${isCustomApproved
                                        ? 'bg-green-500/20 text-green-400 cursor-default'
                                        : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                            >
                                {isApprovingCustom || isCustomApproveLoading ? <Loader2 className="animate-spin" size={16} /> :
                                    isCustomApproved ? `Approve ${customSymbol || 'Token'} ✓` : `Approve ${customSymbol || 'Token'}`}
                            </button>

                        </div>

                        <button
                            onClick={handleAddLiquidity}
                            disabled={!isBaseApproved || !isCustomApproved || isAdding || isAddingLoading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAdding || isAddingLoading ? <Loader2 className="animate-spin" /> : 'Add Liquidity'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                            <Layers className="text-slate-600" />
                        </div>
                        <h3 className="text-white font-medium mb-2">No Liquidity Found</h3>
                        <p className="text-slate-400 text-sm px-6">You don't have any liquidity positions to remove.</p>
                    </div>
                )}

            </motion.div>
        </div>
    );
}
