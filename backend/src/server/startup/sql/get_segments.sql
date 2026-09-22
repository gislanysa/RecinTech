-- select all segments from a startup
SELECT
    s.id,
    s.name,
    s.description
FROM
    segment AS s
    INNER JOIN startup_segment AS ss ON ss.segment_id = s.id
WHERE
    ss.startup_id = $1::uuid;
