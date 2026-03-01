-- =====================================================
-- EXTENSION
-- =====================================================
create extension if not exists "pgcrypto";

-- =====================================================
-- CORE MULTI TENANT
-- =====================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  timezone text default 'Asia/Jakarta',
  exam_warning_limit int default 3,
  auto_submit_on_warning boolean default true,
  created_at timestamptz default now(),
  unique (organization_id)
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  is_active boolean default true,
  joined_at timestamptz default now(),
  unique (organization_id, user_id)
);

-- =====================================================
-- RBAC
-- =====================================================

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text check (scope in ('platform','organization')) not null,
  created_at timestamptz default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references roles(id) on delete cascade,
  permission_id uuid references permissions(id) on delete cascade,
  unique (role_id, permission_id)
);

create table member_roles (
  id uuid primary key default gen_random_uuid(),
  organization_member_id uuid references organization_members(id) on delete cascade,
  role_id uuid references roles(id) on delete cascade,
  unique (organization_member_id, role_id)
);

-- =====================================================
-- SUBSCRIPTION
-- =====================================================

create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  max_users int,
  max_concurrent_users int,
  max_storage_mb int,
  price numeric,
  duration_days int,
  created_at timestamptz default now()
);

create table organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  plan_id uuid references subscription_plans(id),
  start_date date,
  end_date date,
  status text check (status in ('active','expired','cancelled')),
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  subscription_id uuid references organization_subscriptions(id),
  amount numeric,
  payment_method text,
  status text,
  external_reference text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- =====================================================
-- ASSESSMENT INVENTORY
-- =====================================================

create table classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  type text check (type in ('reguler', 'tambahan')) default 'reguler',
  created_at timestamptz default now()
);

create table question_banks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table bank_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  bank_id uuid references question_banks(id) on delete cascade,
  type text check (type in ('mcq','essay')),
  question_text text not null,
  difficulty text check (difficulty in ('easy','medium','hard')),
  score_default int default 1,
  created_at timestamptz default now()
);

create table bank_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references bank_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false
);

-- =====================================================
-- EXAM SYSTEM
-- =====================================================

create table exams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  question_bank_id uuid references question_banks(id) on delete set null,
  title text not null,
  description text,
  duration_minutes int not null,
  status text check (status in ('draft', 'scheduled', 'active', 'ended', 'archived')) default 'draft',
  randomize_questions boolean default true,
  randomize_options boolean default true,
  start_time timestamptz,
  end_time timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table exam_schedules (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  start_time timestamptz,
  end_time timestamptz
);

create table exam_question_sources (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  bank_id uuid references question_banks(id),
  difficulty text,
  question_count int
);

create table class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (class_id, user_id)
);

create table exam_targets (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  created_at timestamptz default now(),
  unique (exam_id, class_id)
);

-- =====================================================
-- ATTEMPT SYSTEM
-- =====================================================

create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  exam_id uuid references exams(id) on delete cascade,
  user_id uuid references profiles(id),
  started_at timestamptz,
  finished_at timestamptz,
  status text check (status in ('in_progress','submitted','auto_submitted')),
  total_score numeric,
  tab_switch_count int default 0,
  warning_count int default 0,
  ip_address text,
  device_fingerprint text,
  created_at timestamptz default now()
);

create table exam_attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references exam_attempts(id) on delete cascade,
  question_id uuid references bank_questions(id),
  order_number int
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references exam_attempts(id) on delete cascade,
  question_id uuid references bank_questions(id),
  selected_option_id uuid references bank_question_options(id),
  essay_answer text,
  score numeric,
  is_correct boolean,
  created_at timestamptz default now()
);

-- =====================================================
-- SECURITY & PROCTORING
-- =====================================================

create table attempt_security_logs (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references exam_attempts(id) on delete cascade,
  event_type text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table proctoring_snapshots (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references exam_attempts(id) on delete cascade,
  image_url text,
  captured_at timestamptz default now()
);

-- =====================================================
-- CERTIFICATE
-- =====================================================

create table certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  exam_id uuid references exams(id),
  user_id uuid references profiles(id),
  certificate_number text unique,
  file_url text,
  verification_code text unique,
  issued_at timestamptz default now()
);

-- =====================================================
-- INDEX STRATEGY
-- =====================================================

create index idx_org_members_user on organization_members(user_id);
create index idx_org_members_org on organization_members(organization_id);

create index idx_exam_org on exams(organization_id);
create index idx_attempt_exam_user on exam_attempts(exam_id, user_id);
create index idx_attempt_status on exam_attempts(status);
create index idx_attempt_active on exam_attempts(exam_id) where status = 'in_progress';

create index idx_answers_attempt on answers(attempt_id);
create index idx_bank_questions_bank on bank_questions(bank_id);
create index idx_bank_questions_difficulty on bank_questions(difficulty);

-- =====================================================
-- SEED ROLES
-- =====================================================

insert into roles (name, scope) values
('Admin','platform'),
('Proktor','organization'),
('Guru','organization'),
('Pengawas','organization'),
('Siswa','organization');

insert into permissions (name) values
('manage_organization'),
('manage_members'),
('create_exam'),
('edit_exam'),
('publish_exam'),
('delete_exam'),
('monitor_exam'),
('grade_exam'),
('view_reports'),
('take_exam'),
('manage_subscription');

-- =====================================================
-- ENABLE RLS
-- =====================================================

alter table organizations enable row level security;
alter table organization_settings enable row level security;
alter table organization_members enable row level security;
alter table question_banks enable row level security;
alter table bank_questions enable row level security;
alter table bank_question_options enable row level security;
alter table exams enable row level security;
alter table exam_schedules enable row level security;
alter table exam_question_sources enable row level security;
alter table exam_attempts enable row level security;
alter table exam_attempt_questions enable row level security;
alter table answers enable row level security;
alter table attempt_security_logs enable row level security;
alter table proctoring_snapshots enable row level security;
alter table certificates enable row level security;

-- =====================================================
-- HELPER: PLATFORM ADMIN CHECK
-- Assumes JWT custom claim: role = 'platform_admin'
-- =====================================================

create or replace function is_platform_admin()
returns boolean as $$
begin
  return (auth.jwt() ->> 'role') = 'platform_admin';
end;
$$ language plpgsql stable;

-- =====================================================
-- ORGANIZATION ISOLATION POLICY TEMPLATE
-- =====================================================

-- ORGANIZATIONS
create policy "org_select"
on organizations
for select
using (
  is_platform_admin()
  OR exists (
    select 1 from organization_members om
    where om.user_id = auth.uid()
    and om.organization_id = organizations.id
  )
);

-- ORGANIZATION MEMBERS
create policy "org_members_select"
on organization_members
for select
using (
  is_platform_admin()
  OR user_id = auth.uid()
  OR exists (
    select 1 from organization_members om
    where om.user_id = auth.uid()
    and om.organization_id = organization_members.organization_id
  )
);

-- =====================================================
-- EXAMS ISOLATION
-- =====================================================

create policy "exam_isolation"
on exams
for all
using (
  is_platform_admin()
  OR exists (
    select 1 from organization_members om
    where om.user_id = auth.uid()
    and om.organization_id = exams.organization_id
  )
);

-- =====================================================
-- QUESTION BANK ISOLATION
-- =====================================================

create policy "bank_select" on question_banks for select using (
  is_platform_admin() OR exists (
    select 1 from organization_members om 
    where om.user_id = auth.uid() and om.organization_id = question_banks.organization_id
  )
);

create policy "bank_insert" on question_banks for insert with check (
  is_platform_admin() OR exists (
    select 1 from organization_members om 
    where om.user_id = auth.uid() and om.organization_id = question_banks.organization_id
  )
);

create policy "bank_update" on question_banks for update using (
  is_platform_admin() OR exists (
    select 1 from organization_members om 
    where om.user_id = auth.uid() and om.organization_id = question_banks.organization_id
  )
);

create policy "bank_delete" on question_banks for delete using (
  is_platform_admin() OR exists (
    select 1 from organization_members om 
    where om.user_id = auth.uid() and om.organization_id = question_banks.organization_id
  )
);

create policy "bank_questions_isolation"
on bank_questions
for all
using (
  is_platform_admin()
  OR exists (
    select 1 from organization_members om
    where om.user_id = auth.uid()
    and om.organization_id = bank_questions.organization_id
  )
);

-- =====================================================
-- ATTEMPT POLICY
-- =====================================================

-- Student hanya bisa lihat attempt miliknya
create policy "attempt_select"
on exam_attempts
for select
using (
  is_platform_admin()
  OR user_id = auth.uid()
  OR exists (
    select 1 from organization_members om
    where om.user_id = auth.uid()
    and om.organization_id = exam_attempts.organization_id
  )
);

-- Insert hanya untuk dirinya sendiri
create policy "attempt_insert"
on exam_attempts
for insert
with check (
  user_id = auth.uid()
);

-- =====================================================
-- ANSWERS POLICY
-- =====================================================

create policy "answers_policy"
on answers
for all
using (
  is_platform_admin()
  OR exists (
    select 1 from exam_attempts ea
    where ea.id = answers.attempt_id
    and (
      ea.user_id = auth.uid()
      OR exists (
        select 1 from organization_members om
        where om.user_id = auth.uid()
        and om.organization_id = ea.organization_id
      )
    )
  )
);

-- =====================================================
-- CERTIFICATE POLICY
-- =====================================================

create policy "certificate_policy"
on certificates
for select
using (
  is_platform_admin()
  OR user_id = auth.uid()
  OR exists (
    select 1 from organization_members om
    where om.user_id = auth.uid()
    and om.organization_id = certificates.organization_id
  )
);

-- =====================================================
-- ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Admin (platform) → all permissions
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Admin';

-- Proktor
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.name in (
  'manage_members',
  'create_exam',
  'edit_exam',
  'publish_exam',
  'monitor_exam',
  'view_reports'
)
where r.name = 'Proktor';

-- Guru
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.name in (
  'create_exam',
  'edit_exam',
  'publish_exam',
  'grade_exam'
)
where r.name = 'Guru';

-- Pengawas
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.name in (
  'monitor_exam',
  'view_reports'
)
where r.name = 'Pengawas';

-- Siswa
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.name in (
  'take_exam'
)
where r.name = 'Siswa';
