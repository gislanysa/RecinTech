-- select an investor from the database
SELECT
    i.id,
    i.kind,
    i.public_profile,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active
FROM
    investor AS i
    INNER JOIN user_account AS u ON i.id = u.id
WHERE
    i.id = $1::uuid;
