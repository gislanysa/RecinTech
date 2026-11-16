-- withdraw a startup's application to a demand
DELETE FROM
    public.demand_application
WHERE
    demand_application.startup_id = $1::uuid
    AND demand_application.demand_id = $2::uuid
    AND demand_application.application_status = 'pending_application'
RETURNING
    demand_id,
    startup_id,
    application_status,
    created_at,
    updated_at;
