-- find an expertise by its ID
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
WHERE
    e.id = $1::uuid;
