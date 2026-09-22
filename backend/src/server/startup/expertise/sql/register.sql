-- register a new startup expertise
INSERT INTO
    public.expertise (name, description)
VALUES
    ($1::text, $2::text)
RETURNING
    id,
    name,
    description;
