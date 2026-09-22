-- Assign an expertise to a startup
INSERT INTO
    public.startup_expertise (startup_id, expertise_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS expertise_id
RETURNING
    expertise_id;
