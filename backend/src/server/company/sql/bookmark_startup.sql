-- bookmark a startup for a company
WITH bookmarked AS (
    INSERT INTO
        public.company_startup_bookmark (company_id, startup_id)
    SELECT
        $1::uuid AS company_id,
        $2::uuid AS startup_id
    RETURNING
        startup_id
)
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
    public.startup
    INNER JOIN bookmarked ON bookmarked.startup_id = startup.id;
