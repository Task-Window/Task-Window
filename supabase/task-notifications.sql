-- Task-Window: notification fields for task submissions
-- Run this once in Supabase SQL Editor.

alter table public.tasks
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists deadline date;

-- Keep contact details private. Do NOT expose these columns through a public
-- browse-tasks page or a public SELECT policy.

comment on column public.tasks.customer_name is 'Name supplied by the client when posting the task';
comment on column public.tasks.customer_email is 'Email supplied by the client for task communication';
comment on column public.tasks.customer_phone is 'Optional WhatsApp/phone supplied by the client';
comment on column public.tasks.deadline is 'Client requested task deadline';
