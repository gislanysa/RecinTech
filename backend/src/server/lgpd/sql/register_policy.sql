-- register a new policy
INSERT INTO
    lgpd_policy (
        version,
        document_url,
        document_hash,
        is_current
    )
VALUES
    (
        $1::integer,
        $2::text,
        $3::text,
        TRUE
    )
RETURNING
    version,
    document_url,
    document_hash,
    published_at,
    is_current;
