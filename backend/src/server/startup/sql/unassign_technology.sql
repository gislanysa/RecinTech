-- unassign a technology from a startup
WITH deleted AS (
    DELETE FROM
        public.startup_technology AS assigned
    WHERE
        assigned.startup_id = $1
        AND assigned.technology_id = $2
    RETURNING
        assigned.technology_id
)
SELECT
    technology.id,
    technology.name,
    technology.description
FROM
    deleted
    JOIN technology ON technology.id = deleted.technology_id;
