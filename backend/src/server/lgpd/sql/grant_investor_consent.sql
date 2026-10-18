-- grant consent to lgpd
INSERT INTO
    investor_lgpd_consent (investor_id, granted, policy_version)
VALUES
    ($1::uuid, TRUE, $2::integer);
