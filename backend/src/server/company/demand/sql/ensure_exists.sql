-- return a single column if the given demand exists
SELECT
    1 AS found
FROM
    demand AS d
WHERE
    d.id = $1::uuid;
