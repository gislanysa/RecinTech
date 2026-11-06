-- select all segments from a demand
SELECT
    s.id,
    s.name,
    s.description
FROM
    segment AS s
    INNER JOIN demand_segment AS ds ON ds.segment_id = s.id
WHERE
    ds.demand_id = $1::uuid
ORDER BY
    s.id;
