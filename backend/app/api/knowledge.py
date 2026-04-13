# ===========================================================
# 知识库 API — 文件上传与文本提取
# ===========================================================

import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/knowledge", tags=["知识库"])

ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf", ".docx", ".doc", ".json"}
MAX_FILE_SIZE = settings.MAX_FILE_SIZE  # 10MB


def extract_text_from_bytes(content: bytes, filename: str) -> str:
    """根据文件扩展名提取纯文本"""
    ext = Path(filename).suffix.lower()

    if ext in (".txt", ".md", ".json"):
        for enc in ("utf-8", "gbk", "gb2312", "latin-1"):
            try:
                return content.decode(enc)
            except (UnicodeDecodeError, LookupError):
                continue
        return content.decode("utf-8", errors="replace")

    if ext == ".pdf":
        try:
            import pypdf
            import io
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
            return "\n\n".join(pages).strip()
        except ImportError:
            raise HTTPException(status_code=500, detail="服务端未安装 pypdf，无法解析 PDF")
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"PDF 解析失败: {str(e)}")

    if ext in (".docx", ".doc"):
        try:
            import docx
            import io
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs).strip()
        except ImportError:
            raise HTTPException(status_code=500, detail="服务端未安装 python-docx，无法解析 Word 文件")
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Word 文件解析失败: {str(e)}")

    raise HTTPException(status_code=400, detail=f"不支持的文件类型: {ext}")


@router.post("/extract")
async def extract_file_text(file: UploadFile = File(...)):
    """上传文件并提取文本内容，返回给前端用于注入 AI 上下文"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {ext}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="文件超过 10MB 限制")

    text = extract_text_from_bytes(content, file.filename)

    return {
        "filename": file.filename,
        "text": text,
        "char_count": len(text),
    }
