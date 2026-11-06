-- register a new segment for startups and investors
INSERT INTO
    public.segment(name, description)
VALUES
    ($1::text, $2::text)
RETURNING
    id,
    name,
    description;
