-- makes the current policy invalid
UPDATE
    lgpd_policy
SET
    is_current = FALSE
WHERE
    is_current
RETURNING
    version,
    document_url,
    document_hash,
    published_at,
    is_current;
