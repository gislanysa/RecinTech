-- Assign an expertise to a startup
WITH assigned AS (
    INSERT INTO
        public.startup_expertise (startup_id, expertise_id)
    VALUES
        ($1::uuid, $2::uuid)
    RETURNING
        expertise_id
)
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
    INNER JOIN assigned AS a ON a.expertise_id = e.id;
