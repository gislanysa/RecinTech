-- find a service by its id
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.service AS s
WHERE
    s.id = $1::uuid;
