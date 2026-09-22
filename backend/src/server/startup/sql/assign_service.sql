-- Assign a service to a Startup
INSERT INTO
    public.startup_service (startup_id, service_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS service_id
RETURNING
    service_id;
