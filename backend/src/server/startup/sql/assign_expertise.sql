-- Assign an expertise to a startup
WITH assigned AS (
    INSERT INTO
        public.startup_expertise (startup_id, expertise_id)
    SELECT
        $1::uuid AS startup_id,
        $2::uuid AS expertise_id
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