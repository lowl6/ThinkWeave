# ===========================================================
# Socket.IO 实时通信 — 房间事件
# ===========================================================

import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
sio_app = socketio.ASGIApp(sio)


@sio.event
async def connect(sid: str, environ: dict):
    """客户端连接，TODO: JWT认证"""
    print(f"[WS] Connected: {sid}")


@sio.event
async def disconnect(sid: str):
    print(f"[WS] Disconnected: {sid}")


@sio.event
async def join_room(sid: str, data: dict):
    """加入房间频道"""
    room_id = data.get("room_id")
    user_name = data.get("user_name", "匿名")
    sio.enter_room(sid, room_id)
    await sio.emit("member_joined", {"user_name": user_name, "sid": sid}, room=room_id, skip_sid=sid)


@sio.event
async def leave_room(sid: str, data: dict):
    """离开房间频道"""
    room_id = data.get("room_id")
    user_name = data.get("user_name", "匿名")
    sio.leave_room(sid, room_id)
    await sio.emit("member_left", {"user_name": user_name}, room=room_id)


@sio.event
async def new_idea(sid: str, data: dict):
    """广播新观点到房间"""
    room_id = data.get("room_id")
    await sio.emit("idea_added", data, room=room_id, skip_sid=sid)


@sio.event
async def idea_selected(sid: str, data: dict):
    """广播观点选中状态变更"""
    room_id = data.get("room_id")
    await sio.emit("idea_selection_changed", data, room=room_id, skip_sid=sid)


@sio.event
async def vote_cast(sid: str, data: dict):
    """广播投票事件"""
    room_id = data.get("room_id")
    await sio.emit("vote_update", data, room=room_id)


@sio.event
async def step_changed(sid: str, data: dict):
    """广播环节切换"""
    room_id = data.get("room_id")
    await sio.emit("step_transition", data, room=room_id)


@sio.event
async def timer_sync(sid: str, data: dict):
    """同步倒计时"""
    room_id = data.get("room_id")
    await sio.emit("timer_tick", data, room=room_id, skip_sid=sid)


@sio.event
async def ai_stream_chunk(sid: str, data: dict):
    """AI流式响应转发"""
    room_id = data.get("room_id")
    await sio.emit("ai_chunk", data, room=room_id)
