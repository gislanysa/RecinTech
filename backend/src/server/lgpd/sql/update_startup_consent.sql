-- update a startup's lgpd consent
WITH recorded AS (
    INSERT INTO
        startup_lgpd_consent_event (
            startup_id,
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
        startup_id,
        consent,
        policy_version
)
INSERT INTO
    startup_lgpd_consent (
        startup_id,
        consent,
        policy_version,
        updated_at
    )
SELECT
    recorded.startup_id,
    recorded.consent,
    recorded.policy_version,
    CURRENT_TIMESTAMP
FROM
    recorded ON conflict(startup_id, policy_version) DO
UPDATE
SET
    consent = EXCLUDED.consent,
    updated_at = EXCLUDED.updated_at
RETURNING
    startup_id::uuid,
    consent::lgpd_consent,
    updated_at::timestamp,
    policy_version::integer;
