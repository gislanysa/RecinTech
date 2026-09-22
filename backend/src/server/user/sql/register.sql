-- register a new user
INSERT INTO
    public.user_account AS u (
        full_name,
        email,
        password_hash
    )
VALUES
    ($1::text, $2::text, $3::text)
RETURNING
    u.id,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active;
