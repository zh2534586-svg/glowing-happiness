import { useState } from 'react';
import { Shield, Fingerprint, Search, FileText, Link, Globe, Check, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const chains = [
  { name: 'Ethereum', icon: '⟠', desc: '最安全的NFT公链' },
  { name: 'Polygon', icon: '◆', desc: '低Gas费，高吞吐量' },
  { name: 'BSN-DDC', icon: '⬡', desc: '国内合规区块链' },
  { name: '蚂蚁链', icon: '🐜', desc: '蚂蚁集团区块链' },
];

export default function Copyright() {
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<any>(null);
  const [nftResult, setNftResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleRegister = async () => {
    if (!user || !title) return;
    setLoading(true);
    try { const { data } = await api.post('/copyright/register', { title }); setResult(data); } catch {}
    setLoading(false);
  };

  const handleMintNFT = async () => {
    if (!result) return;
    try { const { data } = await api.post('/copyright/nft/mint', { copyrightId: result.certificate.id }); setNftResult(data); } catch {}
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">区块链<span className="gradient-text">版权保护</span></h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">基于区块链技术的AI音乐版权登记、溯源和保护平台，支持NFT铸造</p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-20">
          {[
            { icon: Fingerprint, title: '版权登记', desc: '数字指纹上链' },
            { icon: Search, title: '侵权检测', desc: 'AI全网扫描' },
            { icon: FileText, title: '智能合约', desc: '自动版税分配' },
            { icon: Link, title: 'NFT铸造', desc: '一键铸造NFT' },
            { icon: Globe, title: '全球维权', desc: 'DMCA + 国内法' },
          ].map((f) => (
            <div key={f.title} className="glass-card text-center">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3 mx-auto"><f.icon size={20} className="text-primary-400" /></div>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Process */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">版权登记流程</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['上传作品', 'AI指纹生成', '区块链存证', '获取证书', 'NFT铸造'].map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="glass-card text-center !p-4 w-36">
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">{i + 1}</div>
                  <div className="text-sm">{step}</div>
                </div>
                {i < 4 && <div className="text-gray-600 text-xl">→</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Register form */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="glass-card !p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield size={20} className="text-primary-400" />版权登记</h2>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">作品名称</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="输入作品名称" /></div>
              <button onClick={handleRegister} disabled={!title || loading || !user} className="gradient-btn w-full disabled:opacity-50">{loading ? '登记中...' : '区块链版权登记'}</button>
              {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}
            </div>

            {result && (
              <div className="mt-6 p-4 rounded-xl bg-dark-100 space-y-2">
                <div className="text-sm text-green-400 font-medium">✅ 版权登记成功</div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>证书ID: {result.certificate.id}</div>
                  <div>作品: {result.certificate.title}</div>
                  <div>链: {result.certificate.chain} | 区块: #{result.certificate.blockNumber}</div>
                  <div className="font-mono text-gray-500 break-all">TxHash: {result.certificate.txHash}</div>
                </div>
                {!nftResult && (
                  <button onClick={handleMintNFT} className="gradient-btn-outline w-full !py-2 text-sm mt-2">铸造为NFT</button>
                )}
              </div>
            )}

            {nftResult && (
              <div className="mt-4 p-4 rounded-xl bg-dark-100 space-y-2">
                <div className="text-sm text-primary-400 font-medium">🎨 NFT铸造成功</div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Token ID: {nftResult.nft.tokenId}</div>
                  <div>链: {nftResult.nft.chain}</div>
                  <a href={nftResult.nft.marketplace} target="_blank" className="text-primary-400 flex items-center gap-1 hover:underline">查看NFT <ExternalLink size={12} /></a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Supported chains */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-6">支持的公链</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {chains.map((c) => (
              <div key={c.name} className="glass-card text-center !p-4">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-gray-500">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
