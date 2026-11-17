-- unassign a service from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_service AS assigned
    WHERE
        assigned.demand_id = $1
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
