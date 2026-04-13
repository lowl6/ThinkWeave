import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 首页 — 创建/加入房间入口
 * 对应原型: public/首页.html
 */
export default function HomePage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    if (roomCode.trim().length === 9) {
      navigate(`/session/${roomCode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      {/* 品牌 */}
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-brand-500 to-purple-400 bg-clip-text text-transparent">
        ThinkWeave
      </h1>
      <p className="text-gray-400 mb-12">多AI协作 · 人机共创</p>

      {/* 操作卡片 */}
      <div className="w-full max-w-md space-y-6">
        {/* 创建房间 */}
        <button
          onClick={() => navigate('/create')}
          className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-700 transition text-lg font-semibold"
        >
          创建研讨房间
        </button>

        {/* 加入房间 */}
        <div className="flex gap-3">
          <input
            type="text"
            maxLength={9}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            placeholder="输入9位房间号"
            className="flex-1 px-4 py-3 rounded-xl bg-surface-light border border-gray-700 focus:border-brand-500 outline-none text-center text-lg tracking-widest"
          />
          <button
            onClick={handleJoin}
            disabled={roomCode.length !== 9}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 transition font-semibold"
          >
            加入
          </button>
        </div>
      </div>

      {/* 底部 */}
      <div className="mt-16 text-gray-500 text-sm flex gap-6">
        <button onClick={() => navigate('/pricing')} className="hover:text-white transition">
          套餐与定价
        </button>
      </div>
    </div>
  );
}
