-- apply to a demand as a startup
INSERT INTO
    public.demand_application (startup_id, demand_id)
VALUES
    ($1::uuid, $2::uuid)
RETURNING
    demand_id,
    startup_id,
    application_status,
    created_at,
    updated_at;
