-- get all expertises that a given startup is assigned to
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
    INNER JOIN public.startup_expertise AS se ON se.expertise_id = e.id
WHERE
    se.startup_id = $1::uuid;
