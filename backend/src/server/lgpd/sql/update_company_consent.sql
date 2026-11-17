-- update a company's lgpd consent
WITH recorded AS (
    INSERT INTO
        company_lgpd_consent_event (
            company_id,
            consent,
            policy_version,
            occurred_at
        )
    VALUES
        (
            $1::uuid,
            $2::lgpd_consent,
            $3::integer,
            CURRENT_TIMESTAMP
        )
    RETURNING
        company_id,
        consent,
        policy_version
)
INSERT INTO
    company_lgpd_consent (
        company_id,
        consent,
        policy_version,
        updated_at
    )
SELECT
    recorded.company_id,
    recorded.consent,
    recorded.policy_version,
    CURRENT_TIMESTAMP
FROM
    recorded ON conflict(company_id, policy_version) DO
UPDATE
SET
    consent = EXCLUDED.consent,
    updated_at = EXCLUDED.updated_at
RETURNING
    company_id::uuid,
    consent::lgpd_consent,
    updated_at::timestamp,
    policy_version::integer;
