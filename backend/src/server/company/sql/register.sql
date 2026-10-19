-- register a new company on the database
INSERT INTO
    public.company (
        name,
        size,
        email,
        cnpj,
        password_hash,
        city,
        state,
        website
    )
VALUES
    (
        $1::text,
        $2::company_size,
        $3::text,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text
    )
RETURNING
    id::uuid,
    name::text,
    size::company_size,
    email::text,
    cnpj::text,
    city::text,
    state::text,
    created_at,
    is_active::boolean,
    website::text;
