-- assign a given Segment to a Startup
WITH assigned AS (
    INSERT INTO
        public.startup_segment (startup_id, segment_id)
    VALUES
        ($1::uuid, $2::uuid)
    RETURNING
        segment_id
)
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.segment AS s
    INNER JOIN assigned AS a ON a.segment_id = s.id;
