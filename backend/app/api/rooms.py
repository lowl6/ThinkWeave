# ===========================================================
# 房间 CRUD 路由
# ===========================================================

import random
from uuid import UUID as PyUUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.room import Room, RoomStatus
from app.models.room_member import RoomMember, MemberRole
from app.models.agent_config import AgentConfig
from app.models.workflow import WorkflowStep
from app.models.message import Message, MessageType
from app.models.room_state import RoomState
from app.schemas.room import RoomCreate, RoomJoin, RoomOut, RoomUpdate
from app.schemas.message import MessageOut
from app.schemas.room_state import RoomStateOut, RoomStateWrite

router = APIRouter(prefix="/rooms", tags=["房间"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def _ensure_room_member(db: AsyncSession, room_id: PyUUID, user_id: PyUUID) -> Room:
    """房间成员鉴权：返回房间，否则 403/404。"""
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="房间不存在")
    if room.created_by == user_id:
        return room
    result = await db.execute(
        select(RoomMember).where(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="非房间成员")
    return room


def generate_room_code() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(9)])


@router.post("", response_model=RoomOut)
async def create_room(
    data: RoomCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    创建研讨房间。

    TODO: 校验用户套餐权限（房间时长、AI数量限制）
    TODO: 限制用户同时在线房间数
    """
    code = generate_room_code()
    # 确保code唯一
    while await db.execute(select(Room).where(Room.room_code == code)):
        existing = await db.execute(select(Room).where(Room.room_code == code))
        if not existing.scalar_one_or_none():
            break
        code = generate_room_code()

    room = Room(
        room_code=code,
        topic=data.topic,
        password_hash=pwd_context.hash(data.password) if data.password else None,
        created_by=user.id,
    )
    db.add(room)
    await db.flush()

    # 创建者加入房间
    member = RoomMember(room_id=room.id, user_id=user.id, role=MemberRole.HOST, is_online=True)
    db.add(member)

    # 创建Agent配置
    for i, agent_data in enumerate(data.agents):
        agent = AgentConfig(room_id=room.id, **agent_data.model_dump())
        db.add(agent)

    # 创建流程步骤
    for i, step_data in enumerate(data.workflow):
        step = WorkflowStep(room_id=room.id, order=i, **step_data.model_dump())
        db.add(step)

    await db.flush()
    await db.refresh(room)
    return RoomOut.model_validate(room)


@router.post("/join", response_model=RoomOut)
async def join_room(
    data: RoomJoin,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    通过房间号加入房间。

    TODO: 校验密码（如果房间设置了密码）
    TODO: 校验房间人数限制（套餐控制）
    TODO: 通过WebSocket广播成员加入事件
    """
    result = await db.execute(select(Room).where(Room.room_code == data.room_code))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="房间不存在")

    if room.password_hash and data.password:
        if not pwd_context.verify(data.password, room.password_hash):
            raise HTTPException(status_code=403, detail="密码错误")
    elif room.password_hash:
        raise HTTPException(status_code=403, detail="需要密码")

    # 检查是否已加入
    existing_member = await db.execute(
        select(RoomMember).where(RoomMember.room_id == room.id, RoomMember.user_id == user.id)
    )
    if not existing_member.scalar_one_or_none():
        member = RoomMember(room_id=room.id, user_id=user.id, role=MemberRole.MEMBER, is_online=True)
        db.add(member)
        await db.flush()

    await db.refresh(room)
    return RoomOut.model_validate(room)


@router.get("/{room_id}", response_model=RoomOut)
async def get_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取房间详情"""
    room = await db.get(Room, PyUUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="房间不存在")
    return RoomOut.model_validate(room)


@router.patch("/{room_id}", response_model=RoomOut)
async def update_room(
    room_id: str,
    data: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    更新房间配置（仅主持人可操作）。
    """
    room = await db.get(Room, PyUUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="房间不存在")

    # 权限校验：仅 HOST（创建者）可修改
    if room.created_by != user.id:
        result = await db.execute(
            select(RoomMember).where(
                RoomMember.room_id == room.id,
                RoomMember.user_id == user.id,
                RoomMember.role == MemberRole.HOST,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="仅主持人可修改房间配置")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(room, field, value)

    await db.flush()
    return RoomOut.model_validate(room)


@router.get("", response_model=list[RoomOut])
async def list_my_rooms(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """列出当前用户加入的所有房间"""
    result = await db.execute(
        select(Room)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .where(RoomMember.user_id == user.id)
        .order_by(Room.created_at.desc())
    )
    rooms = result.scalars().unique().all()
    return [RoomOut.model_validate(r) for r in rooms]


@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """删除房间（仅创建者/主持人可操作）"""
    room = await db.get(Room, PyUUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="房间不存在")

    # 权限校验：仅创建者或 HOST 可删除
    if room.created_by != user.id:
        result = await db.execute(
            select(RoomMember).where(
                RoomMember.room_id == room.id,
                RoomMember.user_id == user.id,
                RoomMember.role == MemberRole.HOST,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="仅主持人可删除房间")

    # 删除关联数据
    from sqlalchemy import delete as sa_delete
    await db.execute(sa_delete(Message).where(Message.room_id == room.id))
    await db.execute(sa_delete(WorkflowStep).where(WorkflowStep.room_id == room.id))
    await db.execute(sa_delete(AgentConfig).where(AgentConfig.room_id == room.id))
    await db.execute(sa_delete(RoomMember).where(RoomMember.room_id == room.id))
    await db.delete(room)
    await db.flush()
    return {"detail": "房间已删除"}


@router.get("/{room_id}/messages", response_model=list[MessageOut])
async def get_room_messages(
    room_id: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取房间聊天历史"""
    result = await db.execute(
        select(Message)
        .where(Message.room_id == PyUUID(room_id))
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return [MessageOut.model_validate(m) for m in messages]


@router.post("/{room_id}/messages", response_model=MessageOut)
async def post_room_message(
    room_id: str,
    content: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """发送一条用户消息并持久化"""
    msg = Message(
        room_id=PyUUID(room_id),
        sender_id=str(user.id),
        sender_name=user.display_name,
        sender_role="user",
        message_type=MessageType.USER,
        content=content,
    )
    db.add(msg)
    await db.flush()
    return MessageOut.model_validate(msg)


# ── 房间内共享 KV 状态（前端 ScopedStorage 后端版）────────────────
import json as _json


@router.get("/{room_id}/state", response_model=list[RoomStateOut])
async def list_room_states(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """列出当前房间的所有共享键值（含 version，便于前端轮询）。"""
    room_uuid = PyUUID(room_id)
    await _ensure_room_member(db, room_uuid, user.id)
    result = await db.execute(
        select(RoomState).where(RoomState.room_id == room_uuid)
    )
    rows = result.scalars().all()
    out: list[RoomStateOut] = []
    for r in rows:
        try:
            val = _json.loads(r.value) if r.value is not None else None
        except Exception:
            val = None
        out.append(RoomStateOut(
            key=r.key, value=val, version=r.version, updated_at=r.updated_at,
        ))
    return out


@router.get("/{room_id}/state/{key}", response_model=RoomStateOut)
async def get_room_state(
    room_id: str,
    key: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """读取房间内某个共享键。不存在返回 404。"""
    room_uuid = PyUUID(room_id)
    await _ensure_room_member(db, room_uuid, user.id)
    result = await db.execute(
        select(RoomState).where(
            RoomState.room_id == room_uuid,
            RoomState.key == key,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="键不存在")
    try:
        val = _json.loads(row.value) if row.value is not None else None
    except Exception:
        val = None
    return RoomStateOut(
        key=row.key, value=val, version=row.version, updated_at=row.updated_at,
    )


@router.put("/{room_id}/state/{key}", response_model=RoomStateOut)
async def put_room_state(
    room_id: str,
    key: str,
    payload: RoomStateWrite,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """写入或更新房间共享键。版本号自动 +1。"""
    if not key or len(key) > 64:
        raise HTTPException(status_code=400, detail="非法 key")
    room_uuid = PyUUID(room_id)
    await _ensure_room_member(db, room_uuid, user.id)

    try:
        serialized = _json.dumps(payload.value, ensure_ascii=False)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="value 必须可 JSON 序列化")

    result = await db.execute(
        select(RoomState).where(
            RoomState.room_id == room_uuid,
            RoomState.key == key,
        )
    )
    row = result.scalar_one_or_none()
    if row:
        row.value = serialized
        row.version = (row.version or 0) + 1
        row.updated_by = user.id
    else:
        row = RoomState(
            room_id=room_uuid,
            key=key,
            value=serialized,
            version=1,
            updated_by=user.id,
        )
        db.add(row)

    await db.flush()
    await db.refresh(row)
    return RoomStateOut(
        key=row.key, value=payload.value, version=row.version, updated_at=row.updated_at,
    )


@router.post("/{room_id}/control")
async def control_room(
    room_id: str,
    action: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    主持人控制研讨进度。
    action: start | pause | resume | end
    """
    room = await db.get(Room, PyUUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="房间不存在")

    # 仅主持人可控制
    if room.created_by != user.id:
        result = await db.execute(
            select(RoomMember).where(
                RoomMember.room_id == room.id,
                RoomMember.user_id == user.id,
                RoomMember.role == MemberRole.HOST,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="仅主持人可控制研讨进度")

    status_map = {
        "start": RoomStatus.ACTIVE,
        "pause": RoomStatus.PAUSED,
        "resume": RoomStatus.ACTIVE,
        "end": RoomStatus.ENDED,
    }
    new_status = status_map.get(action)
    if not new_status:
        raise HTTPException(status_code=400, detail="无效操作，可选: start, pause, resume, end")

    room.status = new_status
    if action == "end":
        from datetime import datetime, timezone
        room.ended_at = datetime.now(timezone.utc)

    await db.flush()
    return {"status": room.status.value, "action": action}
