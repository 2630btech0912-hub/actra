CREATE OR REPLACE VIEW public.tasks
WITH (security_invoker = on) AS
SELECT
  a.id,
  a.user_id,
  a.document_id,
  a.title,
  a.category,
  a.deadline,
  a.status,
  a.risk_level AS risk,
  a.risk_explanation AS risk_reason,
  a.created_at,
  a.updated_at
FROM public.actions a;

GRANT SELECT, UPDATE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

CREATE OR REPLACE FUNCTION public.tasks_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.actions
  SET risk_level = COALESCE(NEW.risk, risk_level),
      risk_explanation = COALESCE(NEW.risk_reason, risk_explanation),
      status = COALESCE(NEW.status, status),
      deadline = NEW.deadline,
      title = COALESCE(NEW.title, title)
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.tasks_update() FROM public;

CREATE TRIGGER tasks_instead_of_update
INSTEAD OF UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tasks_update();