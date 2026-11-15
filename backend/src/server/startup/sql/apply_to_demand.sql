-- apply to a demand as a startup
INSERT INTO
    public.demand_application (startup_id, demand_id)
VALUES
    ($1::uuid, $2::uuid) ON CONFLICT (demand_id, startup_id) DO
UPDATE
SET
    application_status = 'pending_application',
    updated_at = CURRENT_TIMESTAMP
WHERE
    demand_application.application_status = 'withdrawn_application'
RETURNING
    demand_id,
    startup_id,
    application_status,
    created_at,
    updated_at;
