-- get information about the current lgpd policy
SELECT
    policy.version,
    policy.document_url,
    policy.document_hash,
    policy.published_at,
    policy.is_current
FROM
    public.lgpd_policy AS policy
WHERE
    policy.is_current
LIMIT
    1;
