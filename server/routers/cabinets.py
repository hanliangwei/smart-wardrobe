import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException
from models import CabinetCreate, CabinetUpdate
import database as db

router = APIRouter(prefix="/api/cabinets", tags=["cabinets"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
DELETED_DIR = Path(__file__).parent.parent / "deleted"
DELETED_DIR.mkdir(exist_ok=True)

@router.get("")
def list_cabinets(parent_id: int | None = None):
    cabinets = db.get_cabinets(parent_id)
    # 为每个柜子附加子项计数
    for cab in cabinets:
        cab.update(db.count_children(cab["id"]))
    
    breadcrumbs = []
    if parent_id is not None:
        breadcrumbs = db.get_breadcrumbs(parent_id)

    return {"cabinets": cabinets, "breadcrumbs": breadcrumbs}

@router.post("")
def create_cabinet(data: CabinetCreate):
    if data.parent_id is not None and db.get_cabinet(data.parent_id) is None:
        raise HTTPException(404, "父柜子不存在")
    cabinet = db.create_cabinet(data.name, data.parent_id, data.icon)
    return cabinet

@router.put("/{cabinet_id}")
def update_cabinet(cabinet_id: int, data: CabinetUpdate):
    if db.get_cabinet(cabinet_id) is None:
        raise HTTPException(404, "柜子不存在")
    return db.update_cabinet(cabinet_id, data.name, data.icon)

@router.delete("/{cabinet_id}")
def delete_cabinet(cabinet_id: int):
    if db.get_cabinet(cabinet_id) is None:
        raise HTTPException(404, "柜子不存在")
    # 将该柜子及子柜子下所有衣物图片移到 deleted 目录
    images = db.get_all_images_under_cabinet(cabinet_id)
    for img_name in images:
        src = UPLOAD_DIR / img_name
        if src.exists():
            shutil.move(str(src), str(DELETED_DIR / img_name))
    db.delete_cabinet(cabinet_id)
    return {"ok": True}
