-- assign a given Segment to a Startup
WITH assigned AS (
    INSERT INTO
        public.startup_segment (startup_id, segment_id)
    SELECT
        $1::uuid AS startup_id,
        $2::uuid AS segment_id
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