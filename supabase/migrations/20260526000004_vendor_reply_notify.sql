-- SettleMe — DB trigger that wakes notify-member-of-reply when a vendor
-- inserts into conversation_messages. The function URL + service key are read
-- from per-environment app.settings.* (set once via:
--   alter database postgres set app.settings.notify_reply_url = '...';
--   alter database postgres set app.settings.service_role_key  = '...';
-- ).

create or replace function public.notify_member_of_vendor_reply() returns trigger as $$
declare
  url text := coalesce(current_setting('app.settings.notify_reply_url', true), '');
  key text := coalesce(current_setting('app.settings.service_role_key', true), '');
begin
  if new.sender_kind <> 'vendor' then
    return new;
  end if;
  if url = '' or key = '' then
    return new;
  end if;

  perform net.http_post(
    url := url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key
    ),
    body := jsonb_build_object(
      'conversation_id', new.conversation_id::text,
      'message_id', new.id::text
    )
  );
  return new;
end $$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notify_vendor_reply on public.conversation_messages;
create trigger trg_notify_vendor_reply
after insert on public.conversation_messages
for each row execute function public.notify_member_of_vendor_reply();
