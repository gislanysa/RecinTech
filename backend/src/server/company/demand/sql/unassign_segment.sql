-- unassign a segment from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_segment AS assigned
    WHERE
        assigned.demand_id = $1
        AND assigned.segment_id = $2
    RETURNING
        assigned.segment_id
)
SELECT
    segment.id,
    segment.name,
    segment.description
FROM
    deleted
    JOIN segment ON segment.id = deleted.segment_id;
