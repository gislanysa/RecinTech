-- grant consent to lgpd
INSERT INTO
    startup_lgpd_consent (startup_id, granted, policy_version)
VALUES
    ($1::uuid, TRUE, $2::integer);
