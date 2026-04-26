from pydantic import BaseModel

class CabinetCreate(BaseModel):
    name: str
    parent_id: int | None = None
    icon: str = "📦"

class CabinetUpdate(BaseModel):
    name: str
    icon: str = "📦"

class ClothingMove(BaseModel):
    target_cabinet_id: int

class TextSearchRequest(BaseModel):
    query: str
    season: str | None = None   # 春/夏/秋/冬/四季/全部
    gender: str | None = None   # 男/女/童/通用/全部
    top_k: int = 10

class FilterListRequest(BaseModel):
    season: str | None = None
    gender: str | None = None
