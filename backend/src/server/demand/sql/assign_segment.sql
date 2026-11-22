-- assign a given Segment to a Demand
WITH assigned AS (
    INSERT INTO
        public.demand_segment (demand_id, segment_id)
    VALUES
        ($1::uuid, $2::uuid)
    RETURNING
        segment_id
)
SELECT
    segment.id,
    segment.name,
    segment.description
FROM
    public.segment
    INNER JOIN assigned ON assigned.segment_id = segment.id;
