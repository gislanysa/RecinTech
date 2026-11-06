-- query the lgpd consent of a company
SELECT
    cl.company_id,
    cl.consent,
    cl.policy_version,
    cl.updated_at
FROM
    public.company_lgpd_consent AS cl
WHERE
    cl.company_id = $1::uuid
ORDER BY
    policy_version::integer;
