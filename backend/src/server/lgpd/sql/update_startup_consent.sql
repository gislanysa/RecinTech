-- grant consent to lgpd
INSERT INTO
    startup_lgpd_consent (startup_id, consent, policy_version, updated_at)
VALUES
    (
        $1::uuid,
        $2::lgpd_consent,
        $3::integer,
        CURRENT_TIMESTAMP::timestamp
    )
RETURNING
    startup_id::uuid,
    updated_at::timestamp,
    policy_version::integer;
