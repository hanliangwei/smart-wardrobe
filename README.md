# 智能衣柜 Smart Wardrobe

一个微信小程序，帮你记住每件衣物放在哪个柜子里。支持拍照添加、拍照搜索、文字搜索。

## 架构

```
miniprogram/    → 微信小程序前端
server/         → Python FastAPI 后端 + CLIP 模型
```

## 快速开始

### 1. 启动后端

```bash
cd server
pip install -r requirements.txt
python main.py
```

首次启动会自动下载 CLIP 模型（约 600MB），之后缓存在本地。
服务运行在 `http://localhost:8000`。

### 2. 启动前端

1. 打开**微信开发者工具**
2. 导入项目，目录选择 `d:\MyWorkspace\smart-wardrobe`
3. 在 `project.config.json` 中替换 `appid` 为你的小程序 AppID（或使用测试号）
4. 确保「不校验合法域名」已勾选（开发阶段）

### 3. 配置后端地址

修改 `miniprogram/app.js` 中的 `baseUrl`：
- 本地开发：`http://localhost:8000`
- 部署后：改为服务器地址

## 功能

| 功能 | 说明 |
|------|------|
| 柜子管理  | 创建、嵌套、删除柜子（类似文件夹） |
| 添加衣物  | 拍照/从相册选择，选择柜子，自动生成 CLIP 特征向量 |
| 拍照搜索  | 拍一张照片，AI 找出最相似的衣物及其位置 |
| 文字搜索  | 输入描述（如"红色连衣裙"），AI 语义匹配 |

## 技术栈

- **前端**：微信小程序原生开发
- **后端**：Python FastAPI
- **AI 模型**：OpenAI CLIP (clip-vit-base-patch32)
- **数据库**：SQLite
- **图片处理**：Pillow（上传时压缩到 800px）
