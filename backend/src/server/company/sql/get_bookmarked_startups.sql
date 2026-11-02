-- get all startups bookmarked by a company
SELECT
    startup.id,
    startup.name,
    startup.email,
    startup.stage,
    startup.cnpj,
    startup.description,
    startup.city,
    startup.state,
    startup.created_at,
    startup.updated_at,
    startup.is_active,
    startup.website
FROM
    public.company_startup_bookmark AS b
    INNER JOIN public.startup ON startup.id = b.startup_id
WHERE
    b.company_id = $1::uuid
ORDER BY
    b.created_at DESC
LIMIT
    $2::int OFFSET $3::int;
