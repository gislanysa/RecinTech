-- decline a startup's application to a demand
UPDATE
    public.demand_application
SET
    application_status = 'declined_application',
    updated_at = CURRENT_TIMESTAMP
WHERE
    demand_application.demand_id = $1::uuid
    AND demand_application.startup_id = $2::uuid
    AND demand_application.application_status = 'pending_application'
RETURNING
    demand_id,
    startup_id,
    application_status,
    created_at,
    updated_at;
