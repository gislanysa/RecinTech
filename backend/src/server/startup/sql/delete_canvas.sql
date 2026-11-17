-- delete a startup's business model canvas
DELETE FROM
    public.startup_canvas AS canvas
WHERE
    canvas.startup_id = $1::uuid
RETURNING
    canvas.customer_segments,
    canvas.value_proposition,
    canvas.channels,
    canvas.customer_relationships,
    canvas.revenue_streams,
    canvas.key_resources,
    canvas.key_activities,
    canvas.key_partnerships,
    canvas.cost_structure;
