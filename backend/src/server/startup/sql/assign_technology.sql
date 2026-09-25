-- Assign a startup to a technology
INSERT INTO
    public.startup_technology (startup_id, technology_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS technology_id
RETURNING
    technology_id;
