-- get a maximum of $1 expertises from the database
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
ORDER BY
    id
LIMIT
    $1::int OFFSET $2::int;
