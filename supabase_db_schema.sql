-- =========================================================
-- 1. SETUP SCHEMA & EXTENSIONS
-- =========================================================
create schema if not exists public;
create extension if not exists "uuid-ossp";

-- =========================================================
-- 2. USERS (Sinkronisasi dengan Auth Supabase)
-- =========================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, -- Penting untuk data user
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  social_links jsonb,
  created_at timestamptz default now()
);

-- FUNGSI & TRIGGER: Otomatis copy user dari Auth ke Public Users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

-- Trigger aktif setiap ada user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- 3. MASTER DATA (Licenses, Typologies, Locations)
-- =========================================================
create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text,
  description text
);

create table public.building_typologies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text default 'Indonesia',
  created_at timestamptz default now()
);

-- =========================================================
-- 4. PROJECTS (Inti Aplikasi)
-- =========================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  
  -- Metadata Utama
  title text not null,
  
  -- [DITAMBAHKAN] Wajib ada karena kode frontend mengirim slug
  slug text unique not null, 
  
  description text,
  
  -- [CATATAN] Pastikan frontend mengirim 'published', 'draft', atau 'private'
  -- Jika ingin support 'completed', tambahkan ke dalam kurung IN (...)
  status text default 'published' check (status in ('draft', 'published', 'private')),
  
  year_academic text, 
  
  -- File URLs (Dari Cloudflare R2)
  thumbnail_url text,
  gltf_url text, 
  
  -- Foreign Keys (Relasi)
  license_id uuid references public.licenses(id) on delete set null,
  building_typology_id uuid references public.building_typologies(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,

  -- Statistik & Timestamp
  views integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completion_date date
);

-- Indexing (Sama seperti sebelumnya)
create index on public.projects (user_id);
create index on public.projects (created_at desc);
create index on public.projects (location_id);
create index on public.projects (building_typology_id);

-- Trigger (Sama seperti sebelumnya)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_project_update
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- =========================================================
-- 5. TAGS & SOFTWARE (Many-to-Many Relations)
-- =========================================================

-- TAGS
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_lc text generated always as (lower(name)) stored -- Untuk pencarian case-insensitive
);
create index on public.tags (name_lc);

create table public.project_tags (
  project_id uuid references public.projects(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

-- SOFTWARE
create table public.software (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vendor text,   -- Penambahan kolom vendor
  version text
);
-- Mencegah duplikasi nama software
create unique index on public.software (name, version); 

create table public.project_software (
  project_id uuid references public.projects(id) on delete cascade,
  software_id uuid references public.software(id) on delete cascade,
  primary key (project_id, software_id)
);

-- =========================================================
-- 6. PROJECT IMAGES (Gallery)
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
-- 7. RLS POLICIES (KEAMANAN)
-- =========================================================

-- Aktifkan RLS di semua tabel
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.project_software enable row level security;
alter table public.project_images enable row level security;
alter table public.licenses enable row level security;
alter table public.building_typologies enable row level security;
alter table public.tags enable row level security;
alter table public.software enable row level security;
alter table public.locations enable row level security;

-- --- KEBIJAKAN PUBLIC READ (Master Data) ---
-- Semua orang boleh membaca data referensi
create policy "Public read licenses" on public.licenses for select using (true);
create policy "Public read typologies" on public.building_typologies for select using (true);
create policy "Public read locations" on public.locations for select using (true);
create policy "Public read tags" on public.tags for select using (true);
create policy "Public read software" on public.software for select using (true);
create policy "Public read profiles" on public.users for select using (true);

-- --- KEBIJAKAN PROJECTS (SOLUSI FIX PERMISSION DENIED) ---

-- 1. PUBLIK: Hanya boleh lihat yang statusnya 'published'
create policy "Public view published projects" 
on public.projects for select 
using (status = 'published');

-- 2. OWNER: Boleh melakukan APAPUN (Select, Insert, Update, Delete) pada datanya sendiri
create policy "Owners manage own projects" 
on public.projects for all 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

-- --- KEBIJAKAN PROJECT ASSETS (Images, Tags Pivot, Software Pivot) ---

-- Images: Publik lihat published, Owner manage punya sendiri
create policy "Public view published images" on public.project_images for select using (
  exists (select 1 from public.projects where projects.id = project_images.project_id and projects.status = 'published')
);
create policy "Owners manage images" on public.project_images for all using (
  exists (select 1 from public.projects where projects.id = project_images.project_id and projects.user_id = auth.uid())
);

-- Pivot Tables: Owner boleh atur relasi
create policy "Owners manage project tags" on public.project_tags for all using (
  exists (select 1 from public.projects where projects.id = project_tags.project_id and projects.user_id = auth.uid())
);
create policy "Owners manage project software" on public.project_software for all using (
  exists (select 1 from public.projects where projects.id = project_software.project_id and projects.user_id = auth.uid())
);

-- =========================================================
-- 8. DATA SEEDING (Pengisian Data Awal)
-- =========================================================

-- Licenses
INSERT INTO public.licenses (name, url, description) VALUES
('CC-BY', 'https://creativecommons.org/licenses/by/4.0/', 'Attribution'),
('CC-BY-SA', 'https://creativecommons.org/licenses/by-sa/4.0/', 'Attribution-ShareAlike'),
('CC-BY-NC', 'https://creativecommons.org/licenses/by-nc/4.0/', 'Attribution-NonCommercial'),
('CC0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'Public Domain');

-- Typologies
INSERT INTO public.building_typologies (name, description) VALUES
('Commercial', 'Office and retail'),
('Residential', 'Housing and apartments'),
('Cultural', 'Museums and galleries'),
('Educational', 'Schools and universities'),
('Healthcare', 'Hospitals and clinics'),
('Mixed-Use', 'Combined functions');

-- Locations
INSERT INTO public.locations (name) VALUES
('Jakarta'), ('Bandung'), ('Surabaya'), ('Yogyakarta'), 
('Semarang'), ('Bali'), ('Medan'), ('Makassar'), 
('Luar Negeri (International)');

-- Software (Lengkap dengan Vendor)
INSERT INTO public.software (name, vendor, version) VALUES
('Revit', 'Autodesk', '2024'),
('AutoCAD', 'Autodesk', '2024'),
('3ds Max', 'Autodesk', '2024'),
('SketchUp', 'Trimble', 'Pro'),
('Rhino', 'McNeel', '7'),
('Grasshopper', 'McNeel', 'Visual Scripting'),
('ArchiCAD', 'Graphisoft', '26'),
('Lumion', 'Act-3D', '12'),
('Enscape', 'Chaos', '3.5'),
('V-Ray', 'Chaos', '6'),
('Blender', 'Blender Foundation', '4.0');

-- Tags
INSERT INTO public.tags (name) VALUES
('Modern'), ('Sustainable'), ('Tropical'), ('Minimalist'), 
('Industrial'), ('Parametric'), ('BIM'), ('Green Building'), 
('High-Rise'), ('Bamboo');