# 소개팅 프로필 사진 고르기

남사친 AI가 소개팅 프로필 사진 분석해서 베스트 픽 골라주는 앱

## Vercel 배포 방법

### 1단계 — GitHub에 올리기
1. github.com 에서 새 repository 만들기 (예: `sogeating-profile`)
2. 이 폴더 파일 전부 업로드

### 2단계 — Vercel 연결
1. vercel.com 접속 → "Add New Project"
2. 방금 만든 GitHub repo 선택
3. Framework: **Next.js** 자동 감지됨
4. **Environment Variables** 섹션에서:
   - Key: `ANTHROPIC_API_KEY`
   - Value: 본인 Anthropic API 키 (`sk-ant-...`)
5. Deploy 클릭!

### 3단계 — 링크 공유
배포 완료되면 `https://소개팅-profile.vercel.app` 같은 링크 생성됨 → 친구한테 공유!

## 로컬에서 테스트하려면
```bash
npm install
cp .env.example .env.local
# .env.local 파일에 실제 API 키 입력
npm run dev
```
