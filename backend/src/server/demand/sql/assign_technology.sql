-- Assign a demand to a technology
WITH assigned AS (
    INSERT INTO
        public.demand_technology (demand_id, technology_id)
    VALUES
        ($1::uuid, $2::uuid)
    RETURNING
        technology_id
)
SELECT
    t.id,
    t.name,
    t.description
FROM
    public.technology AS t
    INNER JOIN assigned AS a ON a.technology_id = t.id;
