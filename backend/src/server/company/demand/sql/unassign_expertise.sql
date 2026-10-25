-- unassign an expertise from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_expertise AS assigned
    WHERE
        assigned.demand_id = $1
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
