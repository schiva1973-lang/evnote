# EveryNote 상세 요구사항 정의서 (RFP)

## 1. 프로젝트 개요
사용자별 개인 노트를 관리하고 작성할 수 있는 웹 기반 애플리케이션으로, 계층형 트리 구조와 벡터 기반의 고품질 판서 기능을 핵심으로 합니다.

## 2. 기술 스택 (Decision Finalized)
- **Frontend:** React (Vite), TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **State Management:** Zustand
- **Canvas Engine:** Fabric.js (벡터 기반 객체 조작)
- **Backend (BaaS):** Supabase (Auth, Database, Storage)
- **Deployment:** Vercel

## 3. 핵심 기능 요구사항

### 3.1 사용자 및 인증
- **REQ-AUTH-001:** Supabase Auth를 이용한 이메일/비밀번호 기반 회원가입 및 로그인.
- **REQ-AUTH-002:** RLS(Row Level Security)를 통한 사용자 데이터 접근 격리.

### 3.2 노트북 및 구조 관리
- **REQ-NOTE-001 (일반 노트):** 단일 계층의 페이지 관리 (추가, 순서 변경, 삭제).
- **REQ-NOTE-002 (트리 노트):** 주요 주제(Node) 단위의 계층 구조 지원.
    - **제약 사항:** Tree Depth는 최대 **6단계**로 제한.
    - **조작:** Node 드래그 앤 드롭 이동, 제목 수정 및 삭제.
    - **페이지 이동:** Node 내 다중 페이지 구성 및 Node 간 페이지 드래그 앤 드롭 이동 지원.

### 3.3 판서 및 편집 도구 (Fabric.js 기반)
- **REQ-DRAW-001 (도구):** 텍스트 입력, 이미지 삽입, 잉크펜, 형광펜.
- **REQ-DRAW-002 (지우개):** 궤적 기반의 일반 지우개 및 영역 기반 사각형 지우개.
- **REQ-DRAW-003 (속성):** 펜/형광펜 색상 및 두께 조절, 지우개 크기 조절.
- **REQ-DRAW-004 (최적화):** Spline 알고리즘을 적용한 부드러운 필기감 제공.
- **REQ-DRAW-005 (UX):** 캔버스 확대/축소 및 패닝 기능.
- **REQ-DRAW-006 (태블릿 대응):** **펜 모드 전환 버튼**을 통한 오터치 방지 (팜 리젝션 우회 구현).

### 3.4 데이터 저장 및 성능
- **REQ-DATA-001 (동기화):** **Debounced Auto-save** 방식을 적용하여 캔버스 데이터(JSON) 자동 저장.
- **REQ-DATA-002 (포맷):** 모든 판서 데이터는 벡터(JSON) 형식으로 저장하여 해상도 유지.

## 4. 제외 및 연기 기능 (Out of Scope for MVP)
- 노트북 및 페이지 내 텍스트 검색 기능 (Phase 2로 연기).
- 소셜 로그인 (Google 등).
- 실시간 동시 편집 (Supabase Realtime 기반 동기화는 차후 고려).

## 5. 개발팀 체크리스트
- [ ] Supabase 프로젝트 생성 및 `notebooks`, `nodes`, `pages` 테이블 RLS 설정 확인.
- [ ] Fabric.js 커스텀 펜 및 Spline 알고리즘 구현 프로토타이핑.
- [ ] Shadcn/UI 테마 및 공통 컴포넌트(사이드바, 툴바) 구성.
- [ ] Zustand를 이용한 글로벌 상태(현재 노트북, 페이지, 도구 설정) 설계.
- [ ] 6단계 계층 구조 제한 로직 구현.