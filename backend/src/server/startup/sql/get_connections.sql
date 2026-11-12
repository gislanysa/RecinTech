-- get all connections from a startup
SELECT
    company_id,
    startup_id,
    connection.connection_status,
    created_at,
    updated_at
FROM
    public.company_startup_connection AS connection
WHERE
    connection.startup_id = $1::uuid
ORDER BY
    connection.created_at DESC
LIMIT
    $2::int OFFSET $3::int;
