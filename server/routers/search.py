from fastapi import APIRouter
from models import TextSearchRequest, FilterListRequest
import database as db
from clip_service import get_clip_service

router = APIRouter(prefix="/api/search", tags=["search"])

@router.post("/by-text")
def search_by_text(data: TextSearchRequest):
    clip = get_clip_service()
    query_embedding = clip.encode_text(data.query)

    all_items = db.get_all_embeddings(season=data.season, gender=data.gender)
    results = clip.search(query_embedding, all_items, data.top_k)

    for r in results:
        r["cabinet_path"] = db.get_cabinet_path_str(r["cabinet_id"])

    return {"results": results}

@router.post("/by-filter")
def search_by_filter(data: FilterListRequest):
    items = db.list_clothes_by_filter(season=data.season, gender=data.gender)
    for item in items:
        item["cabinet_path"] = db.get_cabinet_path_str(item["cabinet_id"])
    return {"results": items}
