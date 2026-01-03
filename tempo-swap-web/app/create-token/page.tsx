'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CONTRACTS, TOKEN_FACTORY_ABI } from '@/constants/contracts';
import { parseEther } from 'viem';

export default function CreateToken() {
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [supply, setSupply] = useState('1000000');
    const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null);

    const { isConnected } = useAccount();

    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleDeploy = () => {
        if (!name || !symbol || !supply) return;

        // Supply needs to be converted to Wei (18 decimals)
        const supplyWei = parseEther(supply);

        writeContract({
            address: CONTRACTS.TOKEN_FACTORY as `0x${string}`,
            abi: TOKEN_FACTORY_ABI,
            functionName: 'createToken',
            args: [name, symbol, supplyWei],
        });
    };

    useEffect(() => {
        if (isSuccess && hash) {
            // In a real app we'd parse the logs to get the address, but for now we confirm success
            console.log("Token Created!");
        }
    }, [isSuccess, hash]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500"></div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create Token</h2>
                        <p className="text-slate-400 text-sm">Launch your own ERC20 token instantly</p>
                    </div>
                </div>

                {isSuccess ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Token Created!</h3>
                        <p className="text-slate-400 mb-6">Your transaction has been confirmed.</p>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 break-all text-xs font-mono text-slate-500 mb-6">
                            Tx: {hash}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                            Create Another
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2 ml-1">Token Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Tempo Bitcoin"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2 ml-1">Token Symbol</label>
                            <input
                                type="text"
                                placeholder="e.g. TBTC"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2 ml-1">Initial Supply</label>
                            <input
                                type="number"
                                placeholder="1000000"
                                value={supply}
                                onChange={(e) => setSupply(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error.message.split('\n')[0]}
                            </div>
                        )}

                        <button
                            disabled={!isConnected || isPending || isConfirming || !name || !symbol}
                            onClick={handleDeploy}
                            className="w-full group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {!isConnected ? 'Connect Wallet First' :
                                isPending ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Check Wallet...
                                    </>
                                ) : isConfirming ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Confirming...
                                    </>
                                ) : (
                                    <>
                                        Deploy Token
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )
                            }
                        </button>
                    </div>
                )}

            </motion.div>
        </div>
    );
}
