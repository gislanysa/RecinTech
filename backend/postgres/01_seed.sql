-- dummy lgpd policy
INSERT INTO
    lgpd_policy (version, document_url, document_hash, is_current)
VALUES
    (
        1,
        'http://localhost:3000/privacidade',
        repeat('0', 64),
        TRUE
    );
