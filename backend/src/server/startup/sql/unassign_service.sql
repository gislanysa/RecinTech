-- unassign a service from a startup
WITH deleted AS (
    DELETE FROM
        public.startup_service AS assigned
    WHERE
        assigned.startup_id = $1
        AND assigned.service_id = $2
    RETURNING
        assigned.service_id
)
SELECT
    service.id,
    service.name,
    service.description
FROM
    deleted
    JOIN service ON service.id = deleted.service_id;
