import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import BrainstormView from './session/BrainstormView';
import LeafHopperView from './session/LeafHopperView';
import FastFocusView from './session/FastFocusView';
import BucketWalkView from './session/BucketWalkView';
import PopcornSortView from './session/PopcornSortView';
import StrawPollView from './session/StrawPollView';
import SessionLayout from '@/components/layout/SessionLayout';

/**
 * 研讨会话页 — 主聊天 + 环节子路由
 * 对应原型: public/首页.html（聊天区域）
 */
export default function SessionPage() {
  const { roomId } = useParams<{ roomId: string }>();

  // TODO: 连接WebSocket, 获取房间数据
  // TODO: 根据当前工作流进度自动跳转到对应环节

  return (
    <SessionLayout roomId={roomId!}>
      <Routes>
        <Route path="brainstorm/:stepId" element={<BrainstormView />} />
        <Route path="leafhopper/:stepId" element={<LeafHopperView />} />
        <Route path="fastfocus/:stepId" element={<FastFocusView />} />
        <Route path="bucketwalk/:stepId" element={<BucketWalkView />} />
        <Route path="popcornsort/:stepId" element={<PopcornSortView />} />
        <Route path="strawpoll/:stepId" element={<StrawPollView />} />
        <Route path="*" element={<Navigate to={`brainstorm/default`} replace />} />
      </Routes>
    </SessionLayout>
  );
}
