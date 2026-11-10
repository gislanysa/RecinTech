-- send a new connection request
INSERT INTO
    company_startup_connection (company_id, startup_id)
VALUES
    ($1::uuid, $2::uuid)
RETURNING
    company_id,
    startup_id,
    connection_status,
    created_at,
    updated_at;
