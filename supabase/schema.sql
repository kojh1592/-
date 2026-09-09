-- ============================================================
-- 서울소방 화재조사관 정보공유 플랫폼 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 "Run" 하세요.
-- ============================================================

-- 1) 회원 프로필 테이블
--    auth.users(이메일/비밀번호는 Supabase Auth가 관리)에 1:1로 연결됩니다.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  station text not null default '',
  role text not null default '',
  rank text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) 게시글 테이블 (기존 사이트의 모든 카테고리 글을 이 한 테이블에 저장, category로 구분)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  author_id uuid references auth.users(id) on delete set null,
  title text not null default '',
  content text not null default '',
  anonymous boolean not null default false,
  station text not null default '',
  role text not null default '',
  rank text not null default '',
  author_name text not null default '',
  extra text,
  extra2 text,
  link text,
  photo_paths text[] not null default '{}',   -- storage 안의 파일 경로 목록 (최대 3장)
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_category_idx on public.posts(category);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- 3) 새로 가입한 사람의 프로필을 자동 생성하는 트리거
--    회원가입 시 signUp의 options.data 에 넣어준 name/station/role/rank를 그대로 반영합니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, station, role, rank, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'station', ''),
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'rank', ''),
    'pending'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) 관리자 여부를 안전하게 확인하는 함수 (RLS 정책 안에서 재귀 없이 사용하기 위함)
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select status = 'approved' from public.profiles where id = auth.uid()), false);
$$;

-- 5) profiles 정책
drop policy if exists "select own or admin" on public.profiles;
create policy "select own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "admin can update profiles" on public.profiles;
create policy "admin can update profiles" on public.profiles
  for update using (public.is_admin());

-- 6) posts 정책 — 승인된 회원만 읽고 쓸 수 있음
drop policy if exists "approved can read posts" on public.posts;
create policy "approved can read posts" on public.posts
  for select using (public.is_approved());

drop policy if exists "approved can insert posts" on public.posts;
create policy "approved can insert posts" on public.posts
  for insert with check (public.is_approved());

drop policy if exists "author or admin can update" on public.posts;
create policy "author or admin can update" on public.posts
  for update using (author_id = auth.uid() or public.is_admin());

drop policy if exists "author or admin can delete" on public.posts;
create policy "author or admin can delete" on public.posts
  for delete using (author_id = auth.uid() or public.is_admin());

-- 7) 사진 저장용 Storage 버킷 (비공개 — 승인된 회원만 접근 가능)
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', false)
on conflict (id) do nothing;

drop policy if exists "approved can read photos" on storage.objects;
create policy "approved can read photos" on storage.objects
  for select using (bucket_id = 'post-photos' and public.is_approved());

drop policy if exists "approved can upload photos" on storage.objects;
create policy "approved can upload photos" on storage.objects
  for insert with check (bucket_id = 'post-photos' and public.is_approved());

drop policy if exists "author or admin can delete photos" on storage.objects;
create policy "author or admin can delete photos" on storage.objects
  for delete using (bucket_id = 'post-photos' and (public.is_admin() or owner = auth.uid()));

-- ============================================================
-- ★ 스키마 실행 후 꼭 해주세요 ★
-- 1) 이 사이트에서 본인 계정으로 회원가입을 한 번 하세요 (승인 대기 상태로 생성됩니다)
-- 2) Supabase 대시보드 → Table Editor → profiles 테이블에서 본인 행을 찾아
--    status 를 'approved' 로, is_admin 을 true 로 직접 바꿔주세요.
--    (최초 관리자 지정은 코드가 아니라 이 수동 작업으로 합니다 — 그래야 아무나 스스로
--    관리자가 될 수 없어요)
-- 3) 이후 새 팀원 승인은 사이트 안 "계정 승인" 관리자 화면에서 하시면 됩니다.
-- ============================================================
