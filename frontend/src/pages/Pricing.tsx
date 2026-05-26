import { useState } from 'react';
import { Check, Zap, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const plans = [
  {
    id: 'free', name: '免费版', price: 0, credits: 10, popular: false,
    features: ['AI歌曲检测 x3/月', '音轨分离 x1/月', '基础音色库访问', '社区支持'],
  },
  {
    id: 'basic', name: '基础版', price: 29.9, credits: 100, popular: false,
    features: ['AI歌曲检测 x50/月', '音轨分离 x20/月', 'AI翻唱 x10/月', 'AI配音 x20/月', '标准音色库', '邮件支持'],
  },
  {
    id: 'pro', name: '专业版', price: 99.9, credits: 500, popular: true,
    features: ['全部AI功能无限使用', 'AI作曲 x50/月', 'AI MV x10/月', 'AI短视频 x30/月', '全音色库访问', 'API访问权限', '优先支持'],
  },
  {
    id: 'enterprise', name: '企业版', price: 499.9, credits: 5000, popular: false,
    features: ['全部功能无限使用', '专属GPU集群', '私有化部署选项', '定制音色开发', '7x24专属技术支持', 'SLA 99.9%保障', 'API无限调用'],
  },
];

const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: '💚', desc: '扫码支付，即时到账' },
  { id: 'alipay', name: '支付宝', icon: '💙', desc: '安全便捷，支持花呗' },
  { id: 'bank', name: '银行卡', icon: '💳', desc: '支持对公/对私转账' },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [selectedPayment, setSelectedPayment] = useState('wechat');
  const [showPayment, setShowPayment] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payResult, setPayResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handlePay = async () => {
    if (!user) { navigate('/login'); return; }
    setPayLoading(true);
    try {
      const { data } = await api.post('/payment/create-order', { planId: selectedPlan, method: selectedPayment });
      setPayResult(data);
    } catch {}
    setPayLoading(false);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">选择<span className="gradient-text">适合您的</span>方案</h1>
          <p className="text-gray-400 text-lg">从免费开始，随需求升级</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {plans.map((plan) => (
            <div key={plan.id}
              onClick={() => { setSelectedPlan(plan.id); setShowPayment(false); setPayResult(null); }}
              className={`glass-card cursor-pointer relative transition-all ${
                selectedPlan === plan.id ? 'border-primary-500 glow-ring scale-[1.02]' : ''
              } ${plan.popular ? 'border-accent-500/30' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-medium">
                  最受欢迎
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold gradient-text">{plan.price === 0 ? '免费' : `¥${plan.price}`}</span>
                {plan.price > 0 && <span className="text-gray-500 text-sm">/月</span>}
              </div>
              <div className="text-sm text-primary-400 mb-4">{plan.credits} 积分/月</div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400"><Check size={14} className="text-green-400 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <div className={`w-full py-2 rounded-xl text-sm font-medium text-center ${
                selectedPlan === plan.id ? 'gradient-btn' : 'gradient-btn-outline'
              }`}>
                {selectedPlan === plan.id ? '已选择' : '选择方案'}
              </div>
            </div>
          ))}
        </div>

        {/* Payment */}
        {selectedPlan !== 'free' && (
          <div className="max-w-lg mx-auto">
            <div className="glass-card !p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard size={20} className="text-primary-400" />支付方式</h2>

              {!showPayment ? (
                <>
                  <div className="space-y-3 mb-6">
                    {paymentMethods.map((pm) => (
                      <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                          selectedPayment === pm.id ? 'glass border-primary-500 bg-primary-500/5' : 'glass text-gray-400 hover:text-white'
                        }`}>
                        <span className="text-2xl">{pm.icon}</span>
                        <div className="text-left"><div className="font-medium">{pm.name}</div><div className="text-xs text-gray-500">{pm.desc}</div></div>
                        {selectedPayment === pm.id && <Check size={18} className="ml-auto text-primary-400" />}
                      </button>
                    ))}
                  </div>

                  <div className="glass p-4 rounded-xl mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">套餐</span>
                      <span>{plans.find((p) => p.id === selectedPlan)?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-400">月费</span>
                      <span className="text-primary-400 font-bold">¥{plans.find((p) => p.id === selectedPlan)?.price}</span>
                    </div>
                  </div>

                  <button onClick={() => setShowPayment(true)} className="gradient-btn w-full flex items-center justify-center gap-2">
                    <Zap size={18} /> 立即支付 ¥{plans.find((p) => p.id === selectedPlan)?.price}
                  </button>
                </>
              ) : (
                <div className="text-center">
                  {payResult ? (
                    <div>
                      <div className="text-4xl mb-4">✅</div>
                      <h3 className="text-xl font-semibold mb-2">支付成功！</h3>
                      <p className="text-gray-400 mb-2">订单号: {payResult.orderNo}</p>
                      <p className="text-sm text-primary-400">积分已到账，开始创作吧！</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl mb-4">
                        {selectedPayment === 'wechat' ? '💚' : selectedPayment === 'alipay' ? '💙' : '💳'}
                      </div>
                      <p className="mb-6 text-gray-400">
                        {selectedPayment === 'wechat' ? '请使用微信扫描二维码支付' :
                         selectedPayment === 'alipay' ? '请使用支付宝扫描二维码支付' :
                         '请转账至以下账户完成支付'}
                      </p>
                      {selectedPayment === 'bank' ? (
                        <div className="glass p-4 rounded-xl text-left text-sm space-y-2 mb-6">
                          <div className="flex justify-between"><span className="text-gray-400">户名</span><span>AI音乐平台</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">账号</span><span>6222 **** **** 1234</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">银行</span><span>中国工商银行</span></div>
                        </div>
                      ) : (
                        <div className="w-48 h-48 mx-auto mb-6 glass rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📱</div>
                            <div className="text-xs text-gray-500">扫码支付</div>
                            <div className="text-sm font-bold text-primary-400 mt-1">¥{plans.find((p) => p.id === selectedPlan)?.price}</div>
                          </div>
                        </div>
                      )}
                      <button onClick={handlePay} disabled={payLoading}
                        className="gradient-btn w-full disabled:opacity-50">
                        {payLoading ? '处理中...' : '确认支付'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
