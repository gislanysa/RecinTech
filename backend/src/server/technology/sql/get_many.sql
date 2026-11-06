-- get a maximum of $1 technologies from the database
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.technology AS s
ORDER BY
    id
LIMIT
    $1::int OFFSET $2::int;
