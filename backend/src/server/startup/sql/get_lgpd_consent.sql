-- query the lgpd consent of a startup
SELECT
    sc.startup_id,
    sc.consent,
    sc.policy_version,
    sc.updated_at
FROM
    public.startup_lgpd_consent AS sc
WHERE
    sc.startup_id = $1::uuid
ORDER BY
    policy_version::integer;
