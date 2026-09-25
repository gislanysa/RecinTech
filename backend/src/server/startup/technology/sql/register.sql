-- register a new startup technology
INSERT INTO
    public.technology (name, description)
VALUES
    ($1::text, $2::text)
RETURNING
    id,
    name,
    description;
