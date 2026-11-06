-- grant consent to lgpd
INSERT INTO
    company_lgpd_consent (company_id, consent, policy_version, updated_at)
VALUES
    (
        $1::uuid,
        $2::lgpd_consent,
        $3::integer,
        CURRENT_TIMESTAMP::timestamp
    ) ON conflict(company_id, policy_version) DO
UPDATE
SET
    consent = EXCLUDED.consent,
    updated_at = CURRENT_TIMESTAMP
RETURNING
    company_id::uuid,
    consent::lgpd_consent,
    updated_at::timestamp,
    policy_version::integer;
