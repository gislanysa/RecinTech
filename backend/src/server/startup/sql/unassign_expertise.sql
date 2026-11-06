-- unassign an expertise from a startup
WITH deleted AS (
    DELETE FROM
        public.startup_expertise AS assigned
    WHERE
        assigned.startup_id = $1
        AND assigned.expertise_id = $2
    RETURNING
        assigned.expertise_id
)
SELECT
    expertise.id,
    expertise.name,
    expertise.description
FROM
    deleted
    JOIN expertise ON expertise.id = deleted.expertise_id;
