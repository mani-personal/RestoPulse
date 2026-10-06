-- RestoPulse: explicit employee compensation types and salary values.
-- Existing daily_rate is retained for backward compatibility.
alter table public.employees
  add column if not exists pay_type text not null default 'Daily'
    check (pay_type in ('Monthly','Weekly','Daily')),
  add column if not exists monthly_salary numeric(12,2) not null default 0
    check (monthly_salary >= 0),
  add column if not exists weekly_salary numeric(12,2) not null default 0
    check (weekly_salary >= 0);

-- Preserve the existing daily-rate data for current employees while making
-- the stored compensation structure explicit.
update public.employees
set pay_type = 'Daily',
    monthly_salary = 0,
    weekly_salary = 0
where pay_type is null;

create index if not exists employees_pay_type_idx
  on public.employees(restaurant_id, pay_type);
