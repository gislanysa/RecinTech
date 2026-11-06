-- get a maximum of $1 segments from the database
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.segment AS s
ORDER BY
    id
LIMIT
    $1::int OFFSET $2::int;
