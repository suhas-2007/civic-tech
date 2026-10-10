-- enable uuid extension
create extension if not exists "uuid-ossp";

-- projects table
create table if not exists public.projects (
  id text primary key default concat('proj-', gen_random_uuid()::text),
  title text not null,
  description text not null,
  work_type text not null check (work_type in ('road', 'drainage', 'water', 'sewer', 'electrical', 'public_facility', 'other')),
  department text,
  contractor text,
  status text not null default 'planned' check (status in ('planned', 'ongoing', 'delayed', 'completed', 'paused', 'unknown')),
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  address_text text not null,
  latitude double precision,
  longitude double precision,
  budget numeric(12, 2) default 0.00,
  source_ids text[] default array[]::text[],
  data_origin text default 'manual' check (data_origin in ('official', 'public', 'manual', 'demo'))
);

-- indexes for filtering and coordinates
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_work_type on public.projects(work_type);
create index if not exists idx_projects_department on public.projects(department);
create index if not exists idx_projects_coords on public.projects(latitude, longitude);

-- citizen reports table
create table if not exists public.citizen_reports (
  id text primary key default concat('rep-', gen_random_uuid()::text),
  project_id text references public.projects(id) on delete set null,
  category text not null check (category in ('pothole', 'uncoordinated_digging', 'delayed_work', 'water_leak', 'noise_safety', 'other')),
  title text not null,
  description text not null,
  address_text text not null,
  latitude double precision not null,
  longitude double precision not null,
  status text default 'pending_review' check (status in ('pending_review', 'verified', 'resolved')),
  upvotes integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_citizen_reports_project on public.citizen_reports(project_id);

-- enable row level security
alter table public.projects enable row level security;
alter table public.citizen_reports enable row level security;

-- read access policies
create policy "Allow public read access to projects"
  on public.projects
  for select
  using (true);

create policy "Allow public insert to projects"
  on public.projects
  for insert
  with check (true);

create policy "Allow public update to projects"
  on public.projects
  for update
  using (true);

-- citizen report policies
create policy "Allow public read access to citizen_reports"
  on public.citizen_reports
  for select
  using (true);

create policy "Allow public insert to citizen_reports"
  on public.citizen_reports
  for insert
  with check (true);

create policy "Allow public upvote update to citizen_reports"
  on public.citizen_reports
  for update
  using (true);

-- seed projects data
insert into public.projects (
  id, title, description, work_type, department, contractor, status, 
  planned_start_date, planned_end_date, actual_start_date, actual_end_date, 
  address_text, latitude, longitude, budget, source_ids, data_origin
) values
(
  'proj-1',
  'Main St Water Main Replacement',
  'Replacement of 50-year-old cast iron water main to improve reliability and water pressure. Trenching across entire 100-300 block.',
  'water',
  'Water Bureau',
  'Apex Infrastructure',
  'ongoing',
  '2026-09-01',
  '2026-11-15',
  '2026-09-05',
  null,
  '100-300 blocks of Main St',
  40.7128,
  -74.0060,
  450000.00,
  array['doc-w1', 'doc-w2'],
  'official'
),
(
  'proj-2',
  'Main St High-Speed Fiber Optic Installation',
  'Trenching and laying of new municipal broadband fiber lines along the same corridor.',
  'electrical',
  'Technology & Innovation Dept',
  'CityNet LLC',
  'planned',
  '2026-10-20',
  '2026-12-05',
  null,
  null,
  '100-400 blocks of Main St',
  40.7130,
  -74.0055,
  180000.00,
  array['doc-f1'],
  'official'
),
(
  'proj-3',
  'Oak Avenue Road Resurfacing & Milling',
  'Complete asphalt milling and fresh bitumen laying from 1st to 5th Avenue.',
  'road',
  'Dept of Transportation',
  'RoadWorks Inc',
  'delayed',
  '2026-08-15',
  '2026-09-30',
  '2026-08-20',
  null,
  'Oak Ave from 1st to 5th',
  40.7150,
  -74.0100,
  320000.00,
  array['doc-r1'],
  'official'
),
(
  'proj-4',
  'Oak Ave Storm Drainage Deep Trenching',
  'Excavation to install high-capacity stormwater discharge pipe directly under newly planned asphalt.',
  'drainage',
  'Stormwater Authority',
  'Metro Drainage Corp',
  'planned',
  '2026-10-15',
  '2026-11-30',
  null,
  null,
  'Oak Ave & 3rd intersection',
  40.7152,
  -74.0098,
  210000.00,
  array['doc-d1'],
  'official'
),
(
  'proj-5',
  'Civic Center Electric Grid Transformer Upgrade',
  'Upgrading underground substation transformer and backup feeder lines.',
  'electrical',
  'Power & Utilities Board',
  'VoltGrid Energy',
  'ongoing',
  '2026-09-10',
  '2026-10-25',
  '2026-09-10',
  null,
  '250 Broadway, Civic Center',
  40.7138,
  -74.0080,
  580000.00,
  array['doc-e1'],
  'official'
),
(
  'proj-6',
  'Park Row Pedestrian Plaza & Green Buffer',
  'Installation of curb extensions, bioswales, and safety bollards.',
  'public_facility',
  'Parks & Recreation',
  'UrbanScape Builders',
  'completed',
  '2026-05-01',
  '2026-07-20',
  '2026-05-01',
  '2026-07-15',
  'Park Row opposite City Hall',
  40.7118,
  -74.0050,
  140000.00,
  array['doc-p1'],
  'official'
)
on conflict (id) do nothing;

-- seed citizen reports data
insert into public.citizen_reports (
  id, project_id, category, title, description, address_text, latitude, longitude, status, upvotes
) values
(
  'rep-1',
  'proj-1',
  'uncoordinated_digging',
  'Double road excavation within 3 weeks',
  'The road was dug up for fiber lines right after water bureau completed their segment. Traffic blocked during peak hours.',
  'Main St & Commerce St intersection',
  40.7129,
  -74.0058,
  'verified',
  14
),
(
  'rep-2',
  'proj-3',
  'delayed_work',
  'Uncovered gravel trench left open for 2 weeks',
  'Work has stalled on Oak Ave. No workers on site since last Monday, open gravel is a hazard for bikes and cars.',
  'Oak Ave near 2nd St',
  40.7148,
  -74.0095,
  'verified',
  23
),
(
  'rep-3',
  null,
  'pothole',
  'Deep pothole forming near drainage grate',
  'Sunken asphalt around drain cover creating a 4-inch deep pit after sudden rain.',
  'Park Row & Broadway',
  40.7122,
  -74.0065,
  'pending_review',
  7
)
on conflict (id) do nothing;
