-- assign a given Segment to a Startup
INSERT INTO
    public.startup_segment (startup_id, segment_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS segment_id
RETURNING
    segment_id;
