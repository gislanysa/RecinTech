-- get a segment from the database
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.segment AS s
WHERE
    s.id = $1::uuid;
