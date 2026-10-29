-- select startup id and credentials
SELECT
    s.id,
    s.password_hash
FROM
    public.startup AS s
WHERE
    s.email = $1::text;
