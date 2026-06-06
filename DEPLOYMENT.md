# 홀스톡 배포 가이드

외부 접속과 iPhone 홈 화면 설치를 안정적으로 지원하려면 HTTPS가 필요합니다. 기본 배포 대상은 Vercel, 실시간 DB는 Supabase입니다.

현재 프로덕션 URL:

```text
https://hall-stock.vercel.app
```

## 1. Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. Authentication > Providers에서 Email 로그인을 활성화합니다.
4. Authentication > URL Configuration에 배포 URL을 등록합니다.

예시:

```text
Site URL: https://your-project.vercel.app
Redirect URLs:
https://your-project.vercel.app/**
http://localhost:3000/**
```

## 2. Vercel 환경변수

Vercel 프로젝트 Settings > Environment Variables에 아래 값을 Production, Preview, Development 모두 등록합니다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STORE_ID=demo-store
```

`NEXT_PUBLIC_` 값은 브라우저에 노출됩니다. Supabase `anon key`만 넣고 service role key는 절대 넣지 마세요.

현재 앱은 개인 코드 로그인 방식입니다. 기본 개발자 코드는 아래와 같습니다.

```text
PARK-88-DEV
```

운영 DB를 쓰려면 `supabase/schema.sql` 실행 후 위 환경변수를 Vercel에 등록하고 다시 배포해야 합니다. 환경변수가 없으면 기기별 localStorage 데모 모드로 동작하므로 여러 휴대폰이 같은 데이터를 공유하지 않습니다.

## 3. Vercel 배포

GitHub 저장소와 Vercel을 연결하면 push마다 Preview, main 브랜치 push마다 Production 배포가 만들어집니다.

CLI로 직접 배포할 수도 있습니다.

```bash
npm install
npm run build
npx vercel
npx vercel --prod
```

## 4. iPhone 앱 설치

1. iPhone Safari에서 Vercel 배포 URL을 엽니다.
2. 공유 버튼을 누릅니다.
3. 홈 화면에 추가를 선택합니다.
4. 홈 화면의 `홀스톡` 아이콘으로 실행합니다.

Vercel 배포 URL은 HTTPS이므로 manifest, service worker, standalone 실행 모드가 동작합니다.

## 5. 운영 전 확인

- Vercel 배포 URL에서 `/dashboard`가 열리는지 확인
- Supabase에 `items`, `inventory_logs`, `daily_closings` 테이블이 생성됐는지 확인
- 두 기기에서 같은 계정 또는 직원 계정으로 접속 후 한쪽에서 수량 변경 시 다른 쪽 화면에 반영되는지 확인
- iPhone 홈 화면 추가 후 하단 브라우저 UI 없이 앱처럼 열리는지 확인
