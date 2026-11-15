-- select all services from a demand
SELECT
    s.id,
    s.name,
    s.description
FROM
    service AS s
    INNER JOIN demand_service AS ds ON ds.service_id = s.id
WHERE
    ds.demand_id = $1::uuid
ORDER BY
    s.id;
