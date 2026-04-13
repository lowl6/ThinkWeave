import { useNavigate } from 'react-router-dom';

/**
 * 付费页面 — 套餐展示
 * 对应原型: public/付费页面.html
 */
const plans = [
  {
    name: '基础版',
    price: '免费',
    features: ['最多3人协作', '1个AI模型', '30分钟/场次', '基础ThinkLet'],
    highlight: false,
  },
  {
    name: '专业版',
    price: '¥39/月',
    features: ['最多10人协作', '4个AI模型', '无时间限制', '全部ThinkLet', '导出报告'],
    highlight: true,
  },
  {
    name: '团队版',
    price: '¥99/月',
    features: ['无限人数', '不限AI模型', '无时间限制', '全部ThinkLet', '私有部署支持'],
    highlight: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">选择你的套餐</h1>
        <p className="text-gray-400 mb-12">解锁更多AI协作能力</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border ${
                plan.highlight
                  ? 'border-brand-500 bg-brand-600/10 ring-1 ring-brand-500'
                  : 'border-gray-700 bg-surface-light'
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-6">{plan.price}</div>
              <ul className="space-y-2 text-sm text-gray-300 mb-8">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button
                className={`w-full py-2 rounded-lg font-medium transition ${
                  plan.highlight
                    ? 'bg-brand-600 hover:bg-brand-700'
                    : 'bg-surface border border-gray-600 hover:bg-surface-light'
                }`}
              >
                {plan.price === '免费' ? '立即使用' : '订阅'}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-12 text-gray-400 hover:text-white transition"
        >
          ← 返回首页
        </button>
      </div>
    </div>
  );
}
