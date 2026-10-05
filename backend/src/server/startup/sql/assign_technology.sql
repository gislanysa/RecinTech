-- Assign a startup to a technology
WITH assigned AS (
    INSERT INTO
        public.startup_technology (startup_id, technology_id)
    SELECT
        $1::uuid AS startup_id,
        $2::uuid AS technology_id
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