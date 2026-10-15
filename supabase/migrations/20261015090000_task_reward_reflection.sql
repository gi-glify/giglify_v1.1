-- Keep approved task rewards reflected in both the wallet and transaction ledger.
-- The original grading migration defined the function but did not attach the
-- trigger in fresh environments.
create or replace function public.handle_submission_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.completed_at := coalesce(new.completed_at, now());
    new.reward_paid := coalesce(new.reward_approved, (select reward from public.tasks where id = new.task_id));

    insert into public.wallets (user_id)
    values (new.user_id)
    on conflict (user_id) do nothing;

    update public.wallets
      set balance = balance + new.reward_paid,
          updated_at = now()
      where user_id = new.user_id;

    insert into public.transactions (user_id, type, amount, status, description, related_submission_id)
    values (new.user_id, 'task-reward', new.reward_paid, 'completed', 'Reward for task ' || new.task_id, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_submission_status_change on public.task_submissions;
create trigger on_submission_status_change
  before update on public.task_submissions
  for each row execute procedure public.handle_submission_approved();
