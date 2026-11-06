WITH previous AS (
    UPDATE
        lgpd_policy
    SET
        is_current = FALSE
    WHERE
        is_current
    RETURNING
        version
)
INSERT INTO
    lgpd_policy (version, document_url, document_hash, is_current)
SELECT
    $1::integer,
    $2::text,
    $3::text,
    TRUE
FROM
    (
        SELECT
            count(*)
        FROM
            previous
    ) AS previous_count
RETURNING
    version,
    document_url,
    document_hash,
    published_at,
    is_current;
