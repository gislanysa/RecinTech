-- select investor id and credentials
SELECT
    i.id,
    i.password_hash
FROM
    public.company AS i
WHERE
    i.email = $1::text;
