-- remove the bookmark of a startup from a company
WITH unbookmarked AS (
    DELETE FROM
        public.company_startup_bookmark AS bookmark
    WHERE
        bookmark.company_id = $1::uuid
        AND bookmark.startup_id = $2::uuid
    RETURNING
        bookmark.startup_id
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
    INNER JOIN unbookmarked AS u ON u.startup_id = startup.id;
