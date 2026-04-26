import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from PIL import Image
from io import BytesIO
from models import ClothingMove
import database as db
from clip_service import get_clip_service

router = APIRouter(prefix="/api/clothes", tags=["clothes"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
DELETED_DIR = Path(__file__).parent.parent / "deleted"
DELETED_DIR.mkdir(exist_ok=True)
MAX_IMAGE_SIZE = 800  # 最大边长 800px

def compress_and_save(image_bytes: bytes, save_path: Path) -> bytes:
    """压缩图片到合理分辨率并保存，返回压缩后的 bytes"""
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    # 等比缩放
    w, h = img.size
    if max(w, h) > MAX_IMAGE_SIZE:
        ratio = MAX_IMAGE_SIZE / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    buf.seek(0)
    compressed = buf.read()
    save_path.write_bytes(compressed)
    return compressed

@router.get("")
def list_clothes(cabinet_id: int):
    if db.get_cabinet(cabinet_id) is None:
        raise HTTPException(404, "柜子不存在")
    clothes = db.get_clothes(cabinet_id)
    return {"clothes": clothes}

@router.post("")
async def add_clothing(
    image: UploadFile = File(...),
    cabinet_id: int = Form(...),
    description: str = Form(""),
    season: str = Form("四季"),
    gender: str = Form("通用")
):
    if db.get_cabinet(cabinet_id) is None:
        raise HTTPException(404, "柜子不存在")

    raw_bytes = await image.read()
    filename = f"{uuid.uuid4().hex}.jpg"
    save_path = UPLOAD_DIR / filename
    compressed_bytes = compress_and_save(raw_bytes, save_path)

    # 生成 CLIP embedding
    clip = get_clip_service()
    embedding = clip.encode_image(compressed_bytes)
    embedding_bytes = embedding.tobytes()

    clothing = db.create_clothing(cabinet_id, filename, description, season, gender, embedding_bytes)
    # 不返回 embedding blob
    clothing.pop("embedding", None)
    return clothing

@router.delete("/{clothing_id}")
def remove_clothing(clothing_id: int):
    item = db.get_clothing(clothing_id)
    if item is None:
        raise HTTPException(404, "衣物不存在")
    # 将图片移到 deleted 目录
    img_path = UPLOAD_DIR / item["image_path"]
    if img_path.exists():
        shutil.move(str(img_path), str(DELETED_DIR / item["image_path"]))
    db.delete_clothing(clothing_id)
    return {"ok": True}

@router.put("/{clothing_id}/move")
def move_clothing(clothing_id: int, data: ClothingMove):
    if db.get_clothing(clothing_id) is None:
        raise HTTPException(404, "衣物不存在")
    if db.get_cabinet(data.target_cabinet_id) is None:
        raise HTTPException(404, "目标柜子不存在")
    db.move_clothing(clothing_id, data.target_cabinet_id)
    return {"ok": True}
