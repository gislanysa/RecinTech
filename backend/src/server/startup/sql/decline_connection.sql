-- decline a company's request to connect
UPDATE
    public.company_startup_connection AS connection
SET
    connection_status = 'declined',
    updated_at = CURRENT_TIMESTAMP
WHERE
    connection.company_id = $1::uuid
    AND connection.startup_id = $2::uuid
    AND connection.connection_status = 'pending'
RETURNING
    company_id,
    startup_id,
    connection_status,
    created_at,
    updated_at;
