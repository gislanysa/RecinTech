-- browse demands marked as open
SELECT
    demand.id,
    demand.company_id,
    demand.title,
    demand.description,
    demand.demand_status,
    demand.budget,
    demand.created_at,
    demand.updated_at
FROM
    demand
WHERE
    demand.demand_status = 'open'
ORDER BY
    demand.id DESC
LIMIT
    $1 OFFSET $2
