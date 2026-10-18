-- grant consent to lgpd
INSERT INTO
    investor_lgpd_consent (investor_id, consent, policy_version, updated_at)
VALUES
    (
        $1::uuid,
        $2::lgpd_consent,
        $3::integer,
        CURRENT_TIMESTAMP::timestamp
    ) ON conflict(investor_id) DO
UPDATE
SET
    consent = EXCLUDED.consent,
    updated_at = CURRENT_TIMESTAMP
RETURNING
    investor_id::uuid,
    consent::lgpd_consent,
    updated_at::timestamp,
    policy_version::integer;
