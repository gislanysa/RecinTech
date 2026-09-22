-- assign a given Segment to a Startup
INSERT INTO
    public.startup_segment (startup_id, segment_id, is_main_segment)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS segment_id,
    $3::boolean AS is_main_segment
RETURNING
    segment_id;
