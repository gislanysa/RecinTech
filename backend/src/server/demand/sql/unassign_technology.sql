-- unassign a technology from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_technology AS assigned
    WHERE
        assigned.demand_id = $1
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
