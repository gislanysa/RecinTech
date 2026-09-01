-- get all members assigned to a given startup
SELECT
    u.id,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active
FROM
    public.user_account AS u
    INNER JOIN public.startup_membership AS sm ON sm.user_id = u.id
WHERE
    sm.startup_id = $1;
