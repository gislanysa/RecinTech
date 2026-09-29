-- select an investor from the database
SELECT
    i.id,
    i.name,
    i.email,
    i.kind,
    i.public_profile,
    i.created_at,
    i.is_active
FROM
    investor AS i
WHERE
    i.id = $1::uuid;
