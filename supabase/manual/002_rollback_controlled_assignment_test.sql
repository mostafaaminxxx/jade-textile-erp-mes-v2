-- Review-only rollback template for a controlled assignment test.
-- Replace REPLACE_WITH_CONTEXT_ID and REPLACE_WITH_LINE_ID with real ids from the test.
-- This closes only the selected line-order context and clears the selected current_context_id.
-- It keeps line_status unchanged and does not touch feed_percent or feed_cover_days.

begin;

update public.line_order_contexts
set
  is_active = false,
  context_end_at = now(),
  updated_at = now()
where id = 'REPLACE_WITH_CONTEXT_ID'
  and line_id = 'REPLACE_WITH_LINE_ID';

update public.line_current_state
set
  current_context_id = null,
  last_refreshed_at = now(),
  updated_at = now()
where line_id = 'REPLACE_WITH_LINE_ID'
  and current_context_id = 'REPLACE_WITH_CONTEXT_ID';

commit;
