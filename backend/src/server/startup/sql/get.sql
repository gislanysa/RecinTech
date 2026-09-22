-- select an startup;
SELECT
    s.id,
    s.name,
    s.stage,
    s.cnpj,
    s.description,
    s.city,
    s.state,
    s.created_at
FROM
    public.startup AS s
WHERE
    s.id = $1::uuid;
