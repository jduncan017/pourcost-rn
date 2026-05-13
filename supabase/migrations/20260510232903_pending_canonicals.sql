-- Pending canonicals: candidate products that haven't been promoted to the
-- canonical_products table yet. Populated at import time for every row that
-- didn't match an existing canonical. Admins review and promote/reject.

create table pending_canonicals (
  id uuid primary key default gen_random_uuid(),
  candidate_name text not null,
  candidate_brand text,
  candidate_category text,
  candidate_subcategory text,
  candidate_default_size_ml numeric,
  sighting_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'promoted', 'rejected')),
  promoted_to_canonical_id uuid references canonical_products(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null
);

alter table pending_canonicals enable row level security;

-- Any authenticated user can insert (happens during CSV import)
create policy "authenticated users can insert pending canonicals"
  on pending_canonicals for insert
  to authenticated
  with check (auth.uid() is not null);

-- Any authenticated user can read (for deduplication lookups)
create policy "authenticated users can read pending canonicals"
  on pending_canonicals for select
  to authenticated
  using (auth.uid() is not null);

-- Updates (promote/reject) reserved for service role (admin workflows)
-- No UPDATE policy here — service role bypasses RLS
