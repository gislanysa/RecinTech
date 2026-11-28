-- find a demand by its ID
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
    demand.id = $1;
