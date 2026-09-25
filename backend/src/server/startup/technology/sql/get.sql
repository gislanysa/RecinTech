-- find a technology by its id
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.technology AS s
WHERE
    s.id = $1::uuid;
