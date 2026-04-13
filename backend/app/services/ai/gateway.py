# ===========================================================
# AI模型调用统一网关
# ===========================================================

import httpx
from typing import AsyncGenerator

from app.config import get_settings


class AIGateway:
    """
    统一AI模型调用网关，支持多provider路由。
    
    支持模式：
    1. 统一网关（AiHubMix）：所有模型走同一入口
    2. 分厂商直连：每个provider有独立endpoint和key

    TODO: 实现基于model_id到provider的路由
    TODO: 实现请求重试（3次）+ 超时（30s）
    TODO: 实现限流保护
    """

    def __init__(self):
        self.settings = get_settings()
        self.client = httpx.AsyncClient(timeout=30.0)

    def _get_endpoint(self, model_id: str) -> tuple[str, str]:
        """根据model_id获取API endpoint和key"""
        s = self.settings

        # TODO: 完善模型到provider的映射表
        provider_map = {
            "deepseek-v3": (s.DEEPSEEK_BASE_URL or s.AI_GATEWAY_BASE_URL, s.DEEPSEEK_API_KEY or s.AI_GATEWAY_API_KEY),
            "wenxin": (s.WENXIN_BASE_URL or s.AI_GATEWAY_BASE_URL, s.WENXIN_API_KEY or s.AI_GATEWAY_API_KEY),
            "qianwen": (s.QIANWEN_BASE_URL or s.AI_GATEWAY_BASE_URL, s.QIANWEN_API_KEY or s.AI_GATEWAY_API_KEY),
            "gpt-4": (s.OPENAI_BASE_URL or s.AI_GATEWAY_BASE_URL, s.OPENAI_API_KEY or s.AI_GATEWAY_API_KEY),
            "claude": (s.AI_GATEWAY_BASE_URL, s.AI_GATEWAY_API_KEY),
            "gemini": (s.AI_GATEWAY_BASE_URL, s.AI_GATEWAY_API_KEY),
            "kimi": (s.AI_GATEWAY_BASE_URL, s.AI_GATEWAY_API_KEY),
            "glm-4": (s.AI_GATEWAY_BASE_URL, s.AI_GATEWAY_API_KEY),
        }

        base_url, api_key = provider_map.get(
            model_id,
            (s.AI_GATEWAY_BASE_URL, s.AI_GATEWAY_API_KEY),
        )
        return base_url, api_key

    def _get_model_name(self, model_id: str) -> str:
        """model_id到实际API模型名的映射"""
        # TODO: 完善映射关系
        model_name_map = {
            "deepseek-v3": "deepseek-chat",
            "wenxin": "deepseek-chat",
            "qianwen": "deepseek-chat",
            "gpt-4": "gpt-4o",
            "claude": "claude-sonnet-4-20250514",
            "gemini": "gemini-2.5-flash-preview-04-17",
            "kimi": "moonshot-v1-auto",
            "glm-4": "glm-4-flash",
        }
        return model_name_map.get(model_id, model_id)

    async def chat(
        self,
        model_id: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        """
        调用AI模型（非流式）。

        TODO: 实现完整的API调用
        TODO: 统一处理各provider的请求/响应格式差异
        TODO: 错误处理（超时、限流、无效key）
        """
        base_url, api_key = self._get_endpoint(model_id)
        model_name = self._get_model_name(model_id)

        if stream:
            return self._stream_chat(base_url, api_key, model_name, messages, temperature, max_tokens)

        response = await self.client.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": False,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def _stream_chat(
        self,
        base_url: str,
        api_key: str,
        model_name: str,
        messages: list[dict],
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        """
        流式调用AI模型（SSE）。

        TODO: 实现SSE解析
        TODO: yield每个token
        TODO: 处理[DONE]结束标记
        """
        async with self.client.stream(
            "POST",
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            },
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        return
                    # TODO: 解析JSON，yield content delta
                    import json
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if delta:
                            yield delta
                    except json.JSONDecodeError:
                        continue

    async def close(self):
        await self.client.aclose()


# 单例
ai_gateway = AIGateway()
