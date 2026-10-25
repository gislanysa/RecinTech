-- Assign a service to a Demand
WITH assigned AS (
    INSERT INTO
        public.demand_service (demand_id, service_id)
    SELECT
        $1::uuid AS demand_id,
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
