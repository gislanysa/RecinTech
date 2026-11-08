-- return a single column if the given company exists
SELECT
    1 AS found
FROM
    company
WHERE
    company.id = $1::uuid;
