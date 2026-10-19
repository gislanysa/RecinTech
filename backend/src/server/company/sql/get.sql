-- select a company from the database
SELECT
    c.id,
    c.name,
    c.email,
    c.size,
    c.cnpj,
    c.city,
    c.state,
    c.is_active,
    c.created_at,
    c.website
FROM
    public.company AS c
WHERE
    c.id = $1::uuid;
