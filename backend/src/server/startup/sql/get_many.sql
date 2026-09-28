-- get a maximum of $2 startups from the database
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
LIMIT
    $1::int OFFSET $2::int;
