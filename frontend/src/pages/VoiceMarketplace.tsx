import { useState, useEffect } from 'react';
import { Search, Star, ShoppingCart, Play, Download } from 'lucide-react';
import api from '../api/client';
import type { VoiceModel } from '../types';

const categories = ['全部', '流行', '摇滚', '古风', 'R&B', '二次元', '民谣', '电子', '爵士'];

export default function VoiceMarketplace() {
  const [voices, setVoices] = useState<VoiceModel[]>([]);
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketplace/voices').then(({ data }) => setVoices(data.voices)).finally(() => setLoading(false));
  }, []);

  const filtered = voices.filter((v) => {
    if (category !== '全部' && v.category !== category) return false;
    if (search && !v.name.includes(search) && !v.description.includes(search)) return false;
    return true;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4"><span className="gradient-text">AI音色</span>商城</h1>
          <p className="text-gray-400">500+精品AI音色，覆盖流行、古风、二次元等多种风格</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-10" placeholder="搜索音色名称或描述..." />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${category === c ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'}`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Voice grid */}
        {loading ? (
          <div className="text-center py-20"><div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((voice) => (
              <div key={voice.id} className="glass-card group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg">
                    🎤
                  </div>
                  {voice.price > 0 ? (
                    <span className="text-primary-400 font-bold">¥{voice.price}</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">免费</span>
                  )}
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary-400 transition-colors">{voice.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{voice.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-400">{voice.rating}</span>
                    <span className="text-xs text-gray-600">· {voice.downloads.toLocaleString()}下载</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center hover:bg-primary-500/30">
                      <Play size={14} className="text-primary-400" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center hover:bg-primary-500/30">
                      <ShoppingCart size={14} className="text-primary-400" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">by {voice.seller}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
