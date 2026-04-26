import torch
import numpy as np
from PIL import Image
from transformers import ChineseCLIPProcessor, ChineseCLIPModel
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

# Chinese-CLIP: 专为中文训练的 CLIP 模型，large 版本精度更高
MODEL_NAME = "OFA-Sys/chinese-clip-vit-large-patch14"

class CLIPService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading Chinese-CLIP model on device: {self.device}")
        self.model = ChineseCLIPModel.from_pretrained(MODEL_NAME).to(self.device)
        self.processor = ChineseCLIPProcessor.from_pretrained(MODEL_NAME)
        self.model.eval()
        logger.info("Chinese-CLIP model loaded successfully")

    def encode_image(self, image_bytes: bytes) -> np.ndarray:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        return image_features.cpu().numpy().flatten()

    def encode_text(self, text: str) -> np.ndarray:
        inputs = self.processor(text=[text], return_tensors="pt", padding=True, truncation=True).to(self.device)
        with torch.no_grad():
            # 某些 transformers 版本中 get_text_features 内部调用 text_model 时可能无法获取 pooled_output
            # 导致 text_projection(None) 报错，这里改为手动处理
            text_outputs = self.model.text_model(**inputs)
            pooled_output = text_outputs.pooler_output if text_outputs.pooler_output is not None else text_outputs.last_hidden_state[:, 0, :]
            text_features = self.model.text_projection(pooled_output)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        return text_features.cpu().numpy().flatten()

    @staticmethod
    def cosine_similarity(query_vec: np.ndarray, embeddings: np.ndarray) -> np.ndarray:
        return embeddings @ query_vec

    def search(self, query_embedding: np.ndarray, items: list[dict], top_k: int = 10) -> list[dict]:
        if not items:
            return []

        embeddings = np.array([
            np.frombuffer(item["embedding"], dtype=np.float32) for item in items
        ])

        similarities = self.cosine_similarity(query_embedding, embeddings)
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score < 0.05:
                continue
            item = items[idx]
            results.append({
                "id": item["id"],
                "cabinet_id": item["cabinet_id"],
                "image_path": item["image_path"],
                "description": item["description"],
                "season": item.get("season", ""),
                "gender": item.get("gender", ""),
                "score": round(score, 4),
            })
        return results

# 全局单例
clip_service: CLIPService | None = None

def get_clip_service() -> CLIPService:
    global clip_service
    if clip_service is None:
        clip_service = CLIPService()
    return clip_service
