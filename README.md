# AGY Thai Comedy Shorts — Web Studio & Gallery

เว็บแอปพลิเคชันสำหรับรับชมและสำรวจเบื้องหลังการสร้างคลิปการ์ตูน 2D แนวตั้ง (9:16, 1080×1920) ทั้ง 4 ตอน พร้อมซับไตเติล `.srt`, พรีวิวรายซีน 32 เฟรม และข้อมูล Storyboard + Audio Manifest

## Episodes Included

1. **EP.1 เมื่อท้องร้องกลางห้องประชุม** (`มุกออฟฟิศ`) — `videos/ep1.mp4`
2. **EP.2 ประชุมด่วน 5 โมงเย็น ประหยัดค่าไฟ** (`มุกพันทิป`) — `videos/ep2.mp4`
3. **EP.3 ไล่ไปล้างหน้า... หลับคาอ่าง 1 ชม.!** (`แก๊ก 3 ช่อง`) — `videos/ep3.mp4`
4. **EP.4 บ้านรก... รออีก 3 วันก็ชินเอง!** (`ขายหัวเราะ`) — `videos/ep4.mp4`

## Directory Structure

```text
web/
├── index.html               # Web app entry point
├── data/
│   ├── episodes.json        # Merged episode + scene metadata (JSON)
│   └── episodes_data.js     # Browser global (`window.AGY_EPISODES`)
├── videos/                  # Rendered 1080x1920 MP4 clips (ep1..ep4)
├── subtitles/               # UTF-8 SRT subtitle tracks (ep1..ep4)
├── previews/                # Optimized scene preview PNGs (ep1..ep4, 8 scenes each)
├── vercel.json              # Vercel static caching & UTF-8 SRT headers
└── README.md
```

## Regenerating Web Assets

From the project root (`f:\81 คลิป Agy`):

```bash
python build_web_assets.py
```

This copies the latest MP4s and SRTs, optimizes all 32 preview PNGs into `web/previews/`, and rebuilds `web/data/episodes.json` and `web/data/episodes_data.js`.

## Local Preview

Serve the `web/` folder over HTTP (for example with Python):

```bash
cd web
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the repository in Vercel and set **Root Directory** to `web`.
3. Framework Preset: **Other** (pure static site — no build step required).
4. `vercel.json` automatically configures caching for `/videos/*` and `/previews/*`, plus `Content-Type: text/plain; charset=utf-8` for `/subtitles/*.srt`.
