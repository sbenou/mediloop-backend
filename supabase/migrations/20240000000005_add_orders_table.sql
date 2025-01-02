create type order_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status order_status default 'pending' not null,
  total decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- Add updated_at trigger
create trigger handle_updated_at before update on public.orders
  for each row execute procedure moddatetime (updated_at);

-- Create index for faster queries
create index orders_user_id_idx on public.orders(user_id);
create index orders_created_at_idx on public.orders(created_at);