import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "wardrobe.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS cabinets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER,
            icon TEXT DEFAULT '📦',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES cabinets(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS clothes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cabinet_id INTEGER NOT NULL,
            image_path TEXT NOT NULL,
            description TEXT DEFAULT '',
            season TEXT DEFAULT '四季',
            gender TEXT DEFAULT '通用',
            embedding BLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_cabinets_parent ON cabinets(parent_id);
        CREATE INDEX IF NOT EXISTS idx_clothes_cabinet ON clothes(cabinet_id);
    """)
    # 兼容旧数据库：自动添加新列
    columns = [row[1] for row in cursor.execute("PRAGMA table_info(clothes)").fetchall()]
    if "season" not in columns:
        cursor.execute("ALTER TABLE clothes ADD COLUMN season TEXT DEFAULT '四季'")
    if "gender" not in columns:
        cursor.execute("ALTER TABLE clothes ADD COLUMN gender TEXT DEFAULT '通用'")
    conn.commit()
    conn.close()

# ---- Cabinet Operations ----

def create_cabinet(name: str, parent_id: int | None = None, icon: str = "📦") -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO cabinets (name, parent_id, icon) VALUES (?, ?, ?)",
        (name, parent_id, icon)
    )
    conn.commit()
    cabinet_id = cursor.lastrowid
    row = cursor.execute("SELECT * FROM cabinets WHERE id = ?", (cabinet_id,)).fetchone()
    conn.close()
    return dict(row)

def get_cabinets(parent_id: int | None = None) -> list[dict]:
    conn = get_connection()
    if parent_id is None:
        rows = conn.execute("SELECT * FROM cabinets WHERE parent_id IS NULL ORDER BY created_at DESC").fetchall()
    else:
        rows = conn.execute("SELECT * FROM cabinets WHERE parent_id = ? ORDER BY created_at DESC", (parent_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_cabinet(cabinet_id: int) -> dict | None:
    conn = get_connection()
    row = conn.execute("SELECT * FROM cabinets WHERE id = ?", (cabinet_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_breadcrumbs(cabinet_id: int) -> list[dict]:
    """递归获取面包屑路径"""
    conn = get_connection()
    crumbs = []
    current_id = cabinet_id
    while current_id is not None:
        row = conn.execute("SELECT id, name, parent_id FROM cabinets WHERE id = ?", (current_id,)).fetchone()
        if not row:
            break
        crumbs.insert(0, {"id": row["id"], "name": row["name"]})
        current_id = row["parent_id"]
    conn.close()
    return crumbs

def update_cabinet(cabinet_id: int, name: str, icon: str) -> dict | None:
    conn = get_connection()
    conn.execute("UPDATE cabinets SET name = ?, icon = ? WHERE id = ?", (name, icon, cabinet_id))
    conn.commit()
    row = conn.execute("SELECT * FROM cabinets WHERE id = ?", (cabinet_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_images_under_cabinet(cabinet_id: int) -> list[str]:
    """递归获取某柜子及其所有子柜子下的衣物图片路径"""
    conn = get_connection()
    images = []
    queue = [cabinet_id]
    while queue:
        cid = queue.pop()
        rows = conn.execute("SELECT image_path FROM clothes WHERE cabinet_id = ?", (cid,)).fetchall()
        images.extend(r["image_path"] for r in rows)
        children = conn.execute("SELECT id FROM cabinets WHERE parent_id = ?", (cid,)).fetchall()
        queue.extend(r["id"] for r in children)
    conn.close()
    return images

def delete_cabinet(cabinet_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM cabinets WHERE id = ?", (cabinet_id,))
    conn.commit()
    conn.close()

def count_children(cabinet_id: int) -> dict:
    """统计子柜子和衣物数量"""
    conn = get_connection()
    sub_count = conn.execute("SELECT COUNT(*) as c FROM cabinets WHERE parent_id = ?", (cabinet_id,)).fetchone()["c"]
    clothes_count = conn.execute("SELECT COUNT(*) as c FROM clothes WHERE cabinet_id = ?", (cabinet_id,)).fetchone()["c"]
    conn.close()
    return {"sub_cabinets": sub_count, "clothes": clothes_count}

# ---- Clothes Operations ----

def create_clothing(cabinet_id: int, image_path: str, description: str, season: str, gender: str, embedding_bytes: bytes) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO clothes (cabinet_id, image_path, description, season, gender, embedding) VALUES (?, ?, ?, ?, ?, ?)",
        (cabinet_id, image_path, description, season, gender, embedding_bytes)
    )
    conn.commit()
    row = cursor.execute("SELECT * FROM clothes WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(row)

def get_clothes(cabinet_id: int) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, cabinet_id, image_path, description, season, gender, created_at FROM clothes WHERE cabinet_id = ? ORDER BY created_at DESC",
        (cabinet_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_clothing(clothing_id: int) -> dict | None:
    conn = get_connection()
    row = conn.execute("SELECT * FROM clothes WHERE id = ?", (clothing_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def delete_clothing(clothing_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM clothes WHERE id = ?", (clothing_id,))
    conn.commit()
    conn.close()

def move_clothing(clothing_id: int, target_cabinet_id: int):
    conn = get_connection()
    conn.execute("UPDATE clothes SET cabinet_id = ? WHERE id = ?", (target_cabinet_id, clothing_id))
    conn.commit()
    conn.close()

def get_all_embeddings(season: str | None = None, gender: str | None = None) -> list[dict]:
    """获取衣物的 ID 和 embedding，支持按季节和性别过滤"""
    conn = get_connection()
    sql = "SELECT id, cabinet_id, image_path, description, season, gender, embedding FROM clothes WHERE embedding IS NOT NULL"
    params = []
    if season and season != '全部':
        sql += " AND season IN (?, '四季')"
        params.append(season)
    if gender and gender != '全部':
        sql += " AND gender IN (?, '通用')"
        params.append(gender)
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def list_clothes_by_filter(season: str | None = None, gender: str | None = None) -> list[dict]:
    conn = get_connection()
    sql = "SELECT id, cabinet_id, image_path, description, season, gender FROM clothes WHERE 1=1"
    params = []
    if season and season != '全部':
        sql += " AND season IN (?, '四季')"
        params.append(season)
    if gender and gender != '全部':
        sql += " AND gender IN (?, '通用')"
        params.append(gender)
    sql += " ORDER BY created_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_cabinet_path_str(cabinet_id: int) -> str:
    """获取柜子完整路径字符串, 如 '衣柜 > 上层 > 左侧'"""
    crumbs = get_breadcrumbs(cabinet_id)
    return " > ".join(c["name"] for c in crumbs)
