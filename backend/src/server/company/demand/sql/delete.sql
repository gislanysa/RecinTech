-- remove a demand from the database
DELETE FROM
    demand
WHERE
    demand.id = $1
RETURNING
    demand.id,
    demand.company_id,
    demand.title,
    demand.description,
    demand.demand_status,
    demand.created_at,
    demand.updated_at;
