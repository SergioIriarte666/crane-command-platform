-- Grant execute permissions to authenticated users for the manual notification function
GRANT EXECUTE ON FUNCTION public.manual_notify_service_assignment_by_folio(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manual_notify_service_assignment_by_folio(text) TO service_role;
