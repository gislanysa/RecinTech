-- update a demand status
UPDATE
    public.demand
SET
    demand_status = $2,
    updated_at = CURRENT_TIMESTAMP
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
