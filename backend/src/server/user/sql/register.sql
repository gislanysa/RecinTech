-- register a new user
INSERT INTO
    public.user_account AS u (
        full_name,
        email,
        password_hash
    )
VALUES
    ($1, $2, $3)
RETURNING
    u.id,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active;
