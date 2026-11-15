-- create or update a startup's business model canvas
INSERT INTO
    public.startup_canvas (
        startup_id,
        customer_segments,
        value_proposition,
        channels,
        customer_relationships,
        revenue_streams,
        key_resources,
        key_activities,
        key_partnerships,
        cost_structure
    )
VALUES
    (
        $1::uuid,
        $2::text,
        $3::text,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::text
    ) ON CONFLICT (startup_id) DO
UPDATE
SET
    customer_segments = excluded.customer_segments,
    value_proposition = excluded.value_proposition,
    channels = excluded.channels,
    customer_relationships = excluded.customer_relationships,
    revenue_streams = excluded.revenue_streams,
    key_resources = excluded.key_resources,
    key_activities = excluded.key_activities,
    key_partnerships = excluded.key_partnerships,
    cost_structure = excluded.cost_structure,
    updated_at = CURRENT_TIMESTAMP
RETURNING
    customer_segments,
    value_proposition,
    channels,
    customer_relationships,
    revenue_streams,
    key_resources,
    key_activities,
    key_partnerships,
    cost_structure;
