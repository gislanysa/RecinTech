-- register a new startup on the database
INSERT INTO
    public.startup (
        name,
        stage,
        email,
        password_hash,
        cnpj,
        description,
        city,
        state,
        website
    )
VALUES
    (
        $1::text,
        $2::startup_stage,
        $3::text,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text
    )
RETURNING
    id,
    name,
    email,
    stage,
    cnpj,
    description,
    city,
    state,
    created_at,
    is_active,
    website;
