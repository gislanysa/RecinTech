-- updates a demand's information
UPDATE
    public.demand
SET
    title = coalesce(nullif($2::text, ''), title),
    description = coalesce(nullif($3::text, ''), description),
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
    demand.updated_at
