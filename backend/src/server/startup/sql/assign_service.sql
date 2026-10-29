-- Assign a service to a Startup
WITH assigned AS (
    INSERT INTO
        public.startup_service (startup_id, service_id)
    SELECT
        $1::uuid AS startup_id,
        $2::uuid AS service_id
    RETURNING
        service_id
)
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.service AS s
    INNER JOIN assigned AS a ON a.service_id = s.id;
