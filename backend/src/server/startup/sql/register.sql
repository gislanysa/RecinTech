-- register a new startup on the database
INSERT INTO
    public.startup (
        name,
        stage,
        cnpj,
        description,
        city,
        state
    )
VALUES
    (
        $1::text,
        $2::startup_stage,
        $3::text,
        $4::text,
        $5::text,
        $6::text
    )
RETURNING
    id,
    name,
    stage,
    cnpj,
    description,
    city,
    state,
    created_at;
