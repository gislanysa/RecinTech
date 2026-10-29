-- register a new startup service
INSERT INTO
    public.service (name, description)
VALUES
    ($1::text, $2::text)
RETURNING
    id,
    name,
    description;
