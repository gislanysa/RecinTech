-- get all expertises that a given demand is assigned to
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
    INNER JOIN public.demand_expertise AS de ON de.expertise_id = e.id
WHERE
    de.demand_id = $1::uuid
ORDER BY
    e.id;
