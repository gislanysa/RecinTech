-- update information about a company
UPDATE
    company
SET
    name = coalesce(nullif($2::text, ''), name),
    size = coalesce(nullif($3::text, '')::company_size, size),
    email = coalesce(nullif($4::text, ''), email),
    cnpj = coalesce(nullif($5::text, ''), cnpj),
    city = coalesce(nullif($6::text, ''), city),
    state = coalesce(nullif($7::text, ''), state),
    website = coalesce(nullif($8::text, ''), website),
    updated_at = CURRENT_TIMESTAMP
WHERE
    company.id = $1
RETURNING
    company.id,
    company.name,
    company.size,
    company.email,
    company.cnpj,
    company.city,
    company.state,
    company.created_at,
    company.updated_at,
    company.is_active,
    company.website;
