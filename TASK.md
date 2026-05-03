# EveryNote 개발 태스크 로드맵 (TASK.md)

## 1단계: 환경 설정 및 기본 구조 (Scaffolding)
- [x] Vite + React + TypeScript 프로젝트 초기화
- [x] Tailwind CSS 및 Shadcn/UI 설치 및 테마 설정
- [x] Zustand 전역 상태 저장소 설계 (Auth, UI, Canvas 설정)
- [x] Supabase 클라이언트 설정 및 환경 변수(.env) 연동
- [x] 기본 레이아웃 구성 (Sidebar, Header, Main Canvas Area)

## 2단계: 인증 및 사용자 관리 (Authentication)
- [x] 회원가입 및 로그인 UI 구현 (Shadcn/UI 활용)
- [x] Supabase Auth 연동 (이메일/비밀번호)
- [x] 인증 상태에 따른 라우트 보호 (Protected Routes) 구현
- [x] 로그아웃 및 사용자 프로필 표시

## 3단계: 노트북 및 계층 구조 관리 (Structure)
- [x] 노트북(Notebook) 생성/수정/삭제 기능
- [x] 일반 노트와 트리 노트 유형 구분 및 목록 표시
- [x] 트리 노드(Node) 계층 구조 구현 (Recursive Component)
- [x] 트리 깊이(Tree Depth) 6단계 제한 로직 적용
- [ ] 노드 간 드래그 앤 드롭(Drag & Drop) 이동 구현
- [x] 노드 내 페이지(Page) 추가 및 순서 변경 기능

## 4단계: Fabric.js 기반 캔버스 엔진 (Canvas)
- [x] Fabric.js 캔버스 초기화 및 반응형 컨테이너 설정
- [x] 잉크펜 및 형광펜 도구 구현 (색상, 두께 조절 포함)
- [x] Spline 알고리즘 적용으로 부드러운 필기감 구현
- [x] 지우개 도구 (궤적 기반 삭제 및 영역 기반 삭제) 구현
- [x] 텍스트 입력 및 이미지 삽입/리사이징 기능
- [x] 캔버스 확대(Zoom), 축소, 패닝(Panning) 기능
- [x] **펜 모드 전환 버튼** 및 입력 제한 로직 (팜 리젝션 대응)

## 5단계: 데이터 저장 및 동기화 (Persistence)
- [x] 캔버스 데이터(JSON) 직렬화 및 역직렬화 로직
- [x] **Debounced Auto-save** 기능을 통한 Supabase DB 자동 저장
- [ ] 이미지 업로드 및 Supabase Storage 연동
- [x] 페이지 전환 시 데이터 로딩 및 캐싱 최적화

## 6단계: UI 고도화 및 배포 (Final Polish)
- [x] 전체 UI/UX 디자인 디테일 수정 (다크 모드 지원 등)
- [ ] 태블릿 환경 최적화 및 터치 이벤트 최종 점검
- [ ] Vercel을 통한 프로덕션 배포
- [ ] 최종 테스트 및 버그 수정
