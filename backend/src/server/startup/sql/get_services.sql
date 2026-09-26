-- select all services from a startup
SELECT
    s.id,
    s.name,
    s.description
FROM
    service AS s
    INNER JOIN startup_service AS ss ON ss.service_id = s.id
WHERE
    ss.startup_id = $1::uuid;
