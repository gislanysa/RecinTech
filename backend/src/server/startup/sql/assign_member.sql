-- Assign members to a startup
INSERT INTO
    public.startup_membership (startup_id, user_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS user_id
RETURNING
    user_id;
