-- select user id and credentials
SELECT
    u.id,
    u.password_hash
FROM
    public.user_account AS u
WHERE
    u.email = $1;
