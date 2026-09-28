-- get an startup
SELECT
    s.id,
    s.name,
    s.email,
    s.stage,
    s.cnpj,
    s.description,
    s.city,
    s.state,
    s.created_at,
    s.is_active
FROM
    public.startup AS s
WHERE
    s.id = $1::uuid;
