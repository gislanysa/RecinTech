-- register a new demand on the database
INSERT INTO
    public.demand (
        company_id,
        title,
        description,
        demand_status
    )
VALUES
    (
        $1::uuid,
        $2::text,
        $3::text,
        $4::demand_status
    )
RETURNING
    id,
    company_id,
    title,
    description,
    demand_status,
    created_at,
    updated_at;
