-- unassign a segment from a startup
WITH deleted AS (
    DELETE FROM
        public.startup_segment AS assigned
    WHERE
        assigned.startup_id = $1
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
