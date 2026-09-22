-- return a single column if the given startup exists
SELECT
    1 AS found
FROM
    startup AS s
WHERE
    s.id = $1::uuid;
