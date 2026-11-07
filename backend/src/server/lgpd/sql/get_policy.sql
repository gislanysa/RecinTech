-- get information about a given lgpd policy
SELECT
    policy.version,
    policy.document_url,
    policy.document_hash,
    policy.published_at,
    policy.is_current
FROM
    public.lgpd_policy AS policy
WHERE
    version = $1::integer;
