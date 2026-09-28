-- get all technologies that a given startup is assigned to
SELECT
    t.id,
    t.name,
    t.description
FROM
    public.technology AS t
    INNER JOIN public.startup_technology AS st ON st.technology_id = t.id
WHERE
    st.startup_id = $1::uuid;
