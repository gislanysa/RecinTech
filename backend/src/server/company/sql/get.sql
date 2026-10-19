-- select a company from the database
SELECT
    c.id,
    c.name,
    c.email,
    c.created_at,
    c.is_active
FROM
    public.company AS c
WHERE
    c.id = $1::uuid;
