# 서울소방 화재조사관 정보공유 플랫폼 (Next.js + Supabase)

기존 HTML 아티팩트와 같은 내용/기능이지만, 진짜 데이터베이스(Supabase)와 진짜 배포(Vercel)를 쓰는 버전입니다.

## 포함된 기능
- 이메일/비밀번호 회원가입 + **관리자 승인 후 로그인 가능** (Supabase Auth 기반)
- 관리자 화면에서 계정 승인 / 거절 / 접근 회수
- 카테고리별 게시판 (재현실험 아카이브 · 질문방 · 시험자료 · 장비공유 · 세미나 · 자유게시판 · 개발자 문의)
- 글쓰기 시 사진 최대 3장 첨부 (Supabase Storage, 비공개 버킷 — 승인된 회원만 열람 가능)
- 업무 매뉴얼(읽기 전용 참고자료) + 검색
- 역대 재현실험 논문 아카이브(2016~2025) 조회

---

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 에서 새 프로젝트 생성
2. 왼쪽 메뉴 **SQL Editor** → 이 저장소의 `supabase/schema.sql` 파일 내용을 전체 복사해서 붙여넣고 **Run**
3. 왼쪽 메뉴 **Authentication → Providers → Email** 에서 "Confirm email"(이메일 인증) 여부를 정하세요.
   - 내부 소수 인원용이라 간단하게 하고 싶다면 꺼두는 걸 추천합니다.
4. 왼쪽 메뉴 **Project Settings → API** 에서 `Project URL`과 `anon public` 키를 복사해두세요. (다음 단계에서 씁니다)

## 2. 로컬에서 환경변수 설정
`.env.local.example` 파일을 복사해서 `.env.local` 파일을 만들고, 방금 복사한 값을 넣으세요.

```
cp .env.local.example .env.local
```

## 3. GitHub에 올리기
```
git init
git add .
git commit -m "초기 커밋: 서울소방 화재조사관 정보공유 플랫폼"
git branch -M main
git remote add origin https://github.com/사용자명/저장소이름.git
git push -u origin main
```

## 4. Vercel에 연결·배포
1. https://vercel.com 에서 "Add New Project" → 방금 만든 GitHub 저장소 선택
2. **Environment Variables**에 아래 두 개를 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy 클릭 → 몇 분 뒤 실제 주소(예: `your-app.vercel.app`)가 생깁니다.
4. 이후로는 GitHub의 `main` 브랜치에 push할 때마다 Vercel이 **자동으로 재배포**합니다.

## 5. 첫 관리자 지정 (아주 중요)
1. 배포된 사이트에서 본인 이메일로 회원가입 (승인 대기 상태로 생성됨)
2. Supabase 대시보드 → **Table Editor → profiles** 테이블에서 본인 행을 찾아
   - `status` → `approved`
   - `is_admin` → `true`
   로 직접 바꿔주세요. (다른 사람이 스스로 관리자가 될 수 없도록, 최초 관리자 지정만 이렇게 수동으로 합니다)
3. 이후 새 팀원 승인은 사이트 안 관리자 화면("👥 계정 승인")에서 하면 됩니다.

---

## 앞으로 "채팅으로 수정 요청 → 자동 배포"를 반복하려면
이 저장소를 GitHub에 올려둔 상태에서, **Claude 앱(아이패드 포함) → Code 탭 → 클라우드 세션**을 사용하면
컴퓨터 없이도 아이패드만으로 "코드 수정 요청 → GitHub 반영 → Vercel 자동 배포"를 계속 반복할 수 있어요.
(Claude 앱의 Code 탭이 보이지 않으면 요금제에 Claude Code가 포함되어 있는지 먼저 확인해주세요.)

<!-- Vercel 첫 배포 트리거용 커밋 -->
