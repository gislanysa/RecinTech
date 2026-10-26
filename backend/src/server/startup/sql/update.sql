-- update information about a startup
UPDATE
    startup
SET
    name = coalesce(nullif($2::text, ''), name),
    stage = coalesce(nullif($3::text, '')::startup_stage, stage),
    email = coalesce(nullif($4::text, ''), email),
    cnpj = coalesce(nullif($5::text, ''), cnpj),
    description = coalesce(nullif($6::text, ''), description),
    city = coalesce(nullif($7::text, ''), city),
    state = coalesce(nullif($8::text, ''), state),
    website = coalesce(nullif($9::text, ''), website)
WHERE
    startup.id = $1
RETURNING
    startup.id,
    startup.name,
    startup.email,
    startup.stage,
    startup.cnpj,
    startup.description,
    startup.city,
    startup.state,
    startup.created_at,
    startup.is_active,
    startup.website;
