# EveryNote 프로젝트 가이드 (GEMINI.md)

## 1. 프로젝트 개요
**EveryNote**는 사용자별로 개인 노트를 생성하고 관리할 수 있는 웹 기반 애플리케이션입니다. 
단순한 텍스트 노트를 넘어 계층적인 '트리 구조' 관리 기능과 태블릿 환경에 최적화된 고품질 벡터 기반 판서 기능을 제공하는 것을 목표로 합니다.

- **핵심 가치:** 구조화된 노트 관리, 부드럽고 정교한 판서 경험, 기기 간 동기화.
- **주요 대상:** 태블릿을 활용한 학습자, 복잡한 지식 구조를 정리하고자 하는 사용자.

## 2. 기술 스택 (Tech Stack)

### 프론트엔드 (Frontend)
- **Framework:** React (Vite 기반 SPA)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (기본 권장)
- **Canvas/Drawing:** Fabric.js 또는 Paper.js (벡터 기반 엔진 예정)

### 백엔드 (BaaS - Supabase)
- **Database:** PostgreSQL (Supabase DB)
- **Authentication:** Supabase Auth (이메일/비밀번호)
- **Storage:** Supabase Storage (이미지 및 벡터 데이터 저장)
- **Security:** RLS (Row Level Security)를 통한 사용자 데이터 격리

### 인프라 (Infrastructure)
- **Hosting:** Vercel
- **Database Hosting:** Supabase Cloud

## 3. 주요 명령어 (Building and Running)

*현재 소스 코드가 구성되지 않은 초기 단계이므로, 기본 Vite/Supabase 명령어를 가정합니다.*

```bash
# 의존성 설치 (패키지 구성 후)
npm install

# 로컬 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# Supabase 로컬 개발 환경 실행
supabase start

# Supabase 데이터베이스 초기화 및 마이그레이션 적용
supabase db reset
```

## 4. 데이터베이스 구조 (Database Schema)

- `public.notebooks`: 노트북 정보 (유형: general, tree)
- `public.nodes`: 트리 구조를 위한 노드 정보 (계층형)
- `public.pages`: 실제 노트 페이지 데이터 (JSON 형태의 canvas_data 포함)

## 5. 개발 컨벤션 및 원칙 (Development Conventions)

### 코드 스타일 및 아키텍처
- **TypeScript 우선:** 모든 신규 코드는 인터페이스 및 타입 정의를 엄격히 준수합니다.
- **컴포넌트 중심:** UI 로직은 재사용 가능한 React 컴포넌트로 분리합니다.
- **상태 관리:** 복잡한 캔버스 상태 및 트리 구조는 효율적인 상태 관리(예: Zustand, Context API 등)를 활용합니다.

### 판서 및 캔버스 구현
- **벡터 기반:** 모든 드로잉 데이터는 확대 시 해상도 손실이 없는 벡터 형식(JSON/SVG)으로 관리합니다.
- **성능 최적화:** 60fps 렌더링 유지를 위해 Spline 알고리즘 및 효율적인 렌더링 루프를 구현합니다.
- **팜 리젝션:** 태블릿 펜 입력 시 손바닥 터치 무시 로직을 필수적으로 적용합니다.

### 보안 및 데이터 관리
- **RLS 준수:** 모든 테이블은 Row Level Security를 활성화하여 `auth.uid() = user_id` 조건을 필수로 확인합니다.
- **자동 저장:** 사용자 데이터 유실 방지를 위해 로컬 캐싱 기반의 백그라운드 자동 저장 기능을 구현합니다.

## 6. 향후 과제 (TODO)
- [ ] Vite 프로젝트 초기 구조 설정 (React + TS)
- [ ] Supabase 프로젝트 연동 및 환경 변수 설정
- [ ] 공통 UI 레이아웃 및 인증 UI 구현
- [ ] 벡터 캔버스 엔진(Fabric.js 등) 프로토타이핑
- [ ] 트리 구조 탐색기(Sidebar) 구현
