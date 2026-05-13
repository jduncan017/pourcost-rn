-- Pending canonical sizes: bottle sizes seen in imports for a known canonical
-- product that aren't yet in canonical_product_sizes. Lets admins review and
-- promote new sizes without blocking the import.

create table pending_canonical_sizes (
  id uuid primary key default gen_random_uuid(),
  canonical_product_id uuid not null references canonical_products(id) on delete cascade,
  size_ml numeric not null,
  sighting_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Prevent duplicate (product, size) pairs — increment sighting_count instead
  unique (canonical_product_id, size_ml)
);

alter table pending_canonical_sizes enable row level security;

create policy "authenticated users can insert pending canonical sizes"
  on pending_canonical_sizes for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "authenticated users can read pending canonical sizes"
  on pending_canonical_sizes for select
  to authenticated
  using (auth.uid() is not null);
