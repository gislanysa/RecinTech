-- get all applications to a demand
SELECT
    application.demand_id,
    application.startup_id,
    application.application_status,
    application.created_at,
    application.updated_at
FROM
    demand_application AS application
WHERE
    demand_id = $1;
