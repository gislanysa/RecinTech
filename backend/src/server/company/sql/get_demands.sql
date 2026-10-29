-- get all demands assigned to a company
SELECT
    demand.id,
    demand.company_id,
    demand.title,
    demand.description,
    demand.demand_status,
    demand.created_at,
    demand.updated_at
FROM
    demand
WHERE
    demand.company_id = $1
ORDER BY
    demand.id
LIMIT
    $2 OFFSET $3
