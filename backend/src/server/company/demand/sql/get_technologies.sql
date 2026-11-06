-- get all technologies that a given demand is assigned to
SELECT
    t.id,
    t.name,
    t.description
FROM
    public.technology AS t
    INNER JOIN public.demand_technology AS dt ON dt.technology_id = t.id
WHERE
    dt.demand_id = $1::uuid
ORDER BY
    t.id;
