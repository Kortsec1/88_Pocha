# 홀스톡

음식점 홀 직원이 iPhone Safari에서 홈 화면에 추가해서 쓰는 모바일 PWA 재고 관리 앱입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다. Supabase 환경변수가 없으면 localStorage 기반 데모 모드로 바로 실행됩니다.

휴대폰에서 같은 Wi-Fi로 접속하려면 노트북에서 아래 명령을 실행합니다.

```bash
npm run dev:lan
```

현재 노트북 Wi-Fi 주소가 `192.168.0.26`이면 휴대폰 Safari에서 `http://192.168.0.26:3000`으로 접속합니다.
단, iPhone에서 PWA 서비스워커와 홈 화면 설치를 안정적으로 쓰려면 HTTPS 배포가 필요하므로 실제 운영은 Vercel 배포를 권장합니다.

## Supabase 연결

1. Supabase 프로젝트를 생성합니다.
2. `supabase/schema.sql`을 SQL Editor에서 실행합니다.
3. `.env.example`을 참고해 `.env.local`을 작성합니다.
4. `npm run dev`를 다시 실행합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STORE_ID=demo-store
```

수량 변경은 `update_item_quantity` RPC에서 row lock을 잡고 품목 업데이트와 변경 이력 생성을 한 트랜잭션으로 처리합니다.

## 외부 배포

어디서든 접속 가능한 운영 앱은 Vercel에 배포합니다. 자세한 순서는 `DEPLOYMENT.md`를 확인하세요.

현재 배포 URL:

```text
https://hall-stock.vercel.app
```

필수 환경변수:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STORE_ID=demo-store
```

Vercel 배포 URL은 HTTPS이므로 iPhone Safari의 홈 화면 추가 기능과 PWA 서비스워커가 정상 동작합니다.

## 구현된 기능

- 이메일/비밀번호 로그인 구조와 데모 로그인
- 초기 seed 품목 데이터
- 카테고리별 품목 목록
- 수량 빠른 수정과 직접 입력
- 상태 자동 계산
- 변경 이력 저장 및 필터
- 마감 체크리스트와 날짜별 스냅샷 저장
- Supabase Realtime 구독
- iOS Safari 대응 PWA manifest, meta, service worker
