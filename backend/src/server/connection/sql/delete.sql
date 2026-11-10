-- remove a connection between a company and a startup
DELETE FROM
    public.company_startup_connection AS conn
WHERE
    conn.company_id = $1::uuid
    AND conn.startup_id = $2::uuid
RETURNING
    company_id,
    startup_id,
    connection_status,
    created_at,
    updated_at;
