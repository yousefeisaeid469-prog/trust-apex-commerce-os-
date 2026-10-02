-- V236 Customer Commerce OS: durable customer-owned commerce state.
create table if not exists trust_customer_profiles (
 id text primary key,
 email text not null,
 display_name text,
 phone text,
 locale text not null default 'en',
 timezone text not null default 'UTC',
 lifecycle text not null default 'ACTIVE' check(lifecycle in ('ACTIVE','SUSPENDED','DELETED','PENDING_DELETION')),
 marketing_opt_in boolean not null default false,
 personalization_opt_in boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists trust_customer_profiles_email_uq on trust_customer_profiles(lower(email));
create table if not exists trust_customer_addresses (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 kind text not null check(kind in ('SHIPPING','BILLING')),
 label text not null,
 recipient_name text not null,
 line1 text not null,
 line2 text,
 city text not null,
 region text,
 postal_code text,
 country_code char(2) not null,
 phone text,
 is_default boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists trust_customer_addresses_customer_idx on trust_customer_addresses(customer_id,kind,is_default desc,created_at desc);
create table if not exists trust_wishlists (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 name text not null,
 visibility text not null default 'PRIVATE' check(visibility in ('PRIVATE','SHARED')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists trust_wishlist_items (
 id uuid primary key,
 wishlist_id uuid not null references trust_wishlists(id) on delete cascade,
 product_id text not null,
 variant_id text,
 note text,
 priority integer not null default 1 check(priority between 1 and 100),
 added_at timestamptz not null default now(),
 unique(wishlist_id,product_id,variant_id)
);
create index if not exists trust_wishlist_items_lookup_idx on trust_wishlist_items(wishlist_id,priority desc,added_at desc);
create table if not exists trust_saved_carts (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 name text not null,
 status text not null default 'ACTIVE' check(status in ('ACTIVE','CHECKED_OUT','ABANDONED','EXPIRED')),
 currency char(3) not null,
 expires_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists trust_saved_cart_items (
 id uuid primary key,
 saved_cart_id uuid not null references trust_saved_carts(id) on delete cascade,
 product_id text not null,
 variant_id text,
 quantity integer not null check(quantity>0 and quantity<=100),
 unit_price_cents bigint not null check(unit_price_cents>=0),
 currency char(3) not null,
 added_at timestamptz not null default now(),
 unique(saved_cart_id,product_id,variant_id)
);
create index if not exists trust_saved_carts_customer_idx on trust_saved_carts(customer_id,status,updated_at desc);
create table if not exists trust_customer_reviews (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 product_id text not null,
 order_id text,
 rating integer not null check(rating between 1 and 5),
 title text,
 body text not null,
 status text not null default 'PENDING' check(status in ('PENDING','PUBLISHED','REJECTED','REMOVED')),
 source text not null check(source in ('VERIFIED_PURCHASE','CUSTOMER_SUBMITTED','IMPORT')),
 verified_purchase boolean not null default false,
 moderation_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists trust_customer_reviews_product_idx on trust_customer_reviews(product_id,status,verified_purchase desc,created_at desc);
create index if not exists trust_customer_reviews_customer_idx on trust_customer_reviews(customer_id,created_at desc);
create table if not exists trust_customer_preferences (
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 scope text not null check(scope in ('MARKETING','TRANSACTIONAL','PERSONALIZATION','ANALYTICS')),
 key text not null,
 enabled boolean not null,
 value text,
 updated_at timestamptz not null default now(),
 primary key(customer_id,scope,key)
);
create table if not exists trust_customer_privacy_jobs (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 type text not null check(type in ('EXPORT','DELETE')),
 status text not null check(status in ('QUEUED','RUNNING','COMPLETED','FAILED','CANCELLED')),
 requested_at timestamptz not null default now(),
 started_at timestamptz,
 completed_at timestamptz,
 error_code text,
 artifact_key text
);
create index if not exists trust_customer_privacy_jobs_queue_idx on trust_customer_privacy_jobs(status,requested_at);
create table if not exists trust_customer_timeline (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 kind text not null,
 entity_type text not null,
 entity_id text not null,
 action text not null,
 summary text not null,
 metadata jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 unique(customer_id,entity_type,entity_id,action)
);
create index if not exists trust_customer_timeline_customer_idx on trust_customer_timeline(customer_id,occurred_at desc,id desc);
create table if not exists trust_customer_activity (
 id uuid primary key,
 customer_id text not null references trust_customer_profiles(id) on delete cascade,
 action text not null,
 entity_type text not null,
 entity_id text not null,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists trust_customer_activity_customer_idx on trust_customer_activity(customer_id,created_at desc);
create unique index if not exists trust_customer_review_order_product_uq on trust_customer_reviews(customer_id,product_id,coalesce(order_id,'')) where status <> 'REMOVED';
create index if not exists trust_saved_carts_expiry_idx on trust_saved_carts(status,expires_at) where status='ACTIVE' and expires_at is not null;
