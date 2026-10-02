-- get a maximum of $2 startups from the database
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
    s.is_active,
    s.website
FROM
    public.startup AS s
ORDER BY
    id
LIMIT
    $1::int OFFSET $2::int;
