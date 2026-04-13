# ===========================================================
# 聊天 API — 前端调用真实 AI 模型
# ===========================================================

import asyncio
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ai.gateway import ai_gateway
from app.database import get_db
from app.models.message import Message, MessageType
from app.api.deps import get_current_user_optional
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["聊天"])

# 前端模型名 → 后端 model_id 映射
DISPLAY_NAME_MAP = {
    "deepseek-v3": "DeepSeek V3",
    "wenxin": "文心一言",
    "qianwen": "通义千问",
    "gpt-4": "GPT-4",
    "claude": "Claude",
    "gemini": "Gemini",
    "kimi": "Kimi",
    "glm-4": "GLM-4",
}


class ChatRequest(BaseModel):
    message: str
    model_id: str
    history: list[dict] = []
    room_id: str | None = None
    system_prompt: str = "你是一个专业的AI协作助手，正在参与多人研讨。请给出有建设性的、简洁明了的回答。使用中文回复。"
    persist_user: bool = True  # 是否持久化用户消息（多模型并行时仅第一个为True）


class ChatResponse(BaseModel):
    model_id: str
    model_name: str
    content: str


class MultiChatRequest(BaseModel):
    message: str
    model_ids: list[str]
    history: list[dict] = []
    room_id: str | None = None
    system_prompt: str = "你是一个专业的AI协作助手，正在参与多人研讨。请给出有建设性的、简洁明了的回答。使用中文回复。"


@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    """单模型聊天，可选持久化到房间"""
    messages = [{"role": "system", "content": req.system_prompt}]
    # 添加历史消息（最近10轮）
    for h in req.history[-20:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": req.message})

    persist_room = UUID(req.room_id) if req.room_id else None

    # 持久化用户消息（多模型并行时仅第一个请求设 persist_user=True）
    if persist_room and user and req.persist_user:
        user_msg = Message(
            room_id=persist_room,
            sender_id=str(user.id),
            sender_name=user.display_name,
            sender_role="user",
            message_type=MessageType.USER,
            content=req.message,
        )
        db.add(user_msg)

    try:
        content = await ai_gateway.chat(req.model_id, messages)

        # 持久化 AI 回复
        if persist_room:
            ai_msg = Message(
                room_id=persist_room,
                sender_id=req.model_id,
                sender_name=DISPLAY_NAME_MAP.get(req.model_id, req.model_id),
                sender_role="ai",
                message_type=MessageType.AI,
                content=content,
            )
            db.add(ai_msg)
            await db.flush()

        return ChatResponse(
            model_id=req.model_id,
            model_name=DISPLAY_NAME_MAP.get(req.model_id, req.model_id),
            content=content,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI模型调用失败: {str(e)}")


@router.post("/multi", response_model=list[ChatResponse])
async def multi_chat(
    req: MultiChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    """多模型并行聊天 — 同时向多个AI发送同一消息"""
    messages = [{"role": "system", "content": req.system_prompt}]
    for h in req.history[-20:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": req.message})

    persist_room = UUID(req.room_id) if req.room_id else None

    # 持久化用户消息（只保存一条）
    if persist_room and user:
        user_msg = Message(
            room_id=persist_room,
            sender_id=str(user.id),
            sender_name=user.display_name,
            sender_role="user",
            message_type=MessageType.USER,
            content=req.message,
        )
        db.add(user_msg)

    async def call_model(model_id: str) -> ChatResponse:
        try:
            content = await ai_gateway.chat(model_id, messages)
            # 持久化 AI 回复
            if persist_room:
                ai_msg = Message(
                    room_id=persist_room,
                    sender_id=model_id,
                    sender_name=DISPLAY_NAME_MAP.get(model_id, model_id),
                    sender_role="ai",
                    message_type=MessageType.AI,
                    content=content,
                )
                db.add(ai_msg)
            return ChatResponse(
                model_id=model_id,
                model_name=DISPLAY_NAME_MAP.get(model_id, model_id),
                content=content,
            )
        except Exception as e:
            return ChatResponse(
                model_id=model_id,
                model_name=DISPLAY_NAME_MAP.get(model_id, model_id),
                content=f"⚠️ 调用失败: {str(e)}",
            )

    tasks = [call_model(mid) for mid in req.model_ids]
    results = await asyncio.gather(*tasks)

    if persist_room:
        await db.flush()

    return list(results)


@router.get("/models")
async def list_models():
    """列出可用模型"""
    return [
        {"id": "deepseek-v3", "name": "DeepSeek V3", "description": "逻辑推理专家"},
        {"id": "wenxin", "name": "文心一言", "description": "知识整合专家"},
        {"id": "qianwen", "name": "通义千问", "description": "创意发散"},
        {"id": "gpt-4", "name": "GPT-4", "description": "全能助手"},
    ]
