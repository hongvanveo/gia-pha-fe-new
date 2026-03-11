# Gia phả Online - Frontend (generated)

## Requirements
- Node.js 18+ (khuyến nghị)
- Backend chạy và expose base URL theo spec: `/api`

## Setup
```bash
npm install
cp .env.example .env
# sửa VITE_API_BASE_URL cho đúng BE, ví dụ:
# VITE_API_BASE_URL=http://localhost:3000/api
npm run dev
```

## Notes
- Axios đã bật `withCredentials: true` để hỗ trợ refresh token cookie httpOnly.
- Nếu BE không dùng cookie refresh mà trả refresh token trong body, bạn có thể tắt withCredentials và tự lưu refresh token (không khuyến nghị).
