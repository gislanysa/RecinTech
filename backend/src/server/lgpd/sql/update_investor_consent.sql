-- grant consent to lgpd
INSERT INTO
    investor_lgpd_consent (investor_id, consent, policy_version, updated_at)
VALUES
    (
        $1::uuid,
        $2::lgpd_consent,
        $3::integer,
        CURRENT_TIMESTAMP::timestamp
    )
RETURNING
    investor_id::uuid,
    updated_at::timestamp,
    policy_version::integer;
