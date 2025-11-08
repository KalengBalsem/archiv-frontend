create schema public;

-- =========================================================
-- USERS (linked to auth.users)
-- =========================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  full_name text,
  bio text,
  avatar_url text,
  social_links jsonb,
  created_at timestamptz default now()
);
-- Catatan: Indeks 'username' tidak perlu, 'unique' sudah membuatnya.

-- =========================================================
-- LICENSES
-- =========================================================
create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text,
  description text
);

-- =========================================================
-- BUILDING TYPOLOGIES
-- =========================================================
create table public.building_typologies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

-- =========================================================
-- PROJECTS
-- =========================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text,
  thumbnail_url text,
  gltf_url text,
  license_id uuid references public.licenses(id) on delete set null,
  building_typology_id uuid references public.building_typologies(id) on delete set null,
  status text default 'published' check (status in ('draft', 'published', 'private')),
  views integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on public.projects (user_id);
create index on public.projects (created_at desc);
-- Catatan: Indeks 'slug' tidak perlu, 'unique' sudah membuatnya.

-- =========================================================
-- TAGS
-- =========================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_lc text generated always as (lower(name)) stored
);
create index on public.tags (name_lc);

-- Junction: Project ↔ Tags
create table public.project_tags (
  project_id uuid references public.projects(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

-- =========================================================
-- SOFTWARE
-- =========================================================
create table public.software (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text
);

create unique index on public.software (name, version);

-- Junction: Project ↔ Software
create table public.project_software (
  project_id uuid references public.projects(id) on delete cascade,
  software_id uuid references public.software(id) on delete cascade,
  primary key (project_id, software_id)
);

-- =========================================================
-- PROJECT IMAGES
-- =========================================================
create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  caption text,
  position int default 0,
  created_at timestamptz default now()
);

create index on public.project_images (project_id);

-- =========================================================
-- FUNGSI & TRIGGER (REKOMENDASI)
-- =========================================================
-- Fungsi untuk memperbarui kolom 'updated_at' secara otomatis
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Terapkan trigger ke tabel 'projects'
create trigger on_project_update
  before update on public.projects
  for each row
  execute procedure public.handle_updated_at();

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.project_software enable row level security;
alter table public.project_images enable row level security;
-- Aktifkan RLS untuk tabel publik (lihat di bawah)
alter table public.licenses enable row level security;
alter table public.building_typologies enable row level security;
alter table public.tags enable row level security;
alter table public.software enable row level security;

-- =CSS ========================================================
-- RLS POLICIES
-- =========================================================

-- USERS
create policy "Anyone can read profiles"
  on public.users for select
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- PROJECTS
create policy "Anyone can view published projects"
  on public.projects for select
  using (status = 'published' or auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- PROJECT IMAGES
create policy "Anyone can view images of published projects"
  on public.project_images for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
      and (projects.status = 'published' or auth.uid() = projects.user_id)
    )
  );

create policy "Project owner can modify images"
  on public.project_images for all
  using (
    auth.uid() in (
      select user_id from public.projects
      where id = project_images.project_id
    )
  );

-- PROJECT_TAGS
create policy "Project owner can manage tags"
  on public.project_tags for all
  using (
    auth.uid() in (
      select user_id from public.projects
      where id = project_tags.project_id
    )
  );

-- PROJECT_SOFTWARE
create policy "Project owner can manage software"
  on public.project_software for all
  using (
    auth.uid() in (
      select user_id from public.projects
      where id = project_software.project_id
    )
  );

-- =========================================================
-- RLS POLICIES (REKOMENDASI UNTUK TABEL PUBLIK)
-- =========================================================
-- Kebijakan ini mengizinkan SIAPA SAJA untuk MEMBACA (select)
-- tabel-tabel ini, tetapi TIDAK ADA yang bisa MENULIS (insert/update/delete)
-- kecuali admin (melalui dashboard Supabase atau 'service_role').

create policy "Anyone can read licenses"
  on public.licenses for select using (true);

create policy "Anyone can read building typologies"
  on public.building_typologies for select using (true);

create policy "Anyone can read tags"
  on public.tags for select using (true);

create policy "Anyone can read software"
  on public.software for select using (true);