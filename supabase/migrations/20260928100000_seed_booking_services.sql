INSERT INTO public.services (
    name,
    slug,
    description,
    short_desc,
    category,
    price_from,
    price_to,
    price_label,
    duration_minutes,
    is_featured,
    is_published,
    display_order,
    icon
)
VALUES
    (
        'General Consultation',
        'general-consultation',
        'Veterinary consultation for assessing a pet''s health concerns and care needs.',
        'General veterinary visit',
        'Consultation',
        NULL,
        NULL,
        NULL,
        NULL,
        true,
        true,
        10,
        'stethoscope'
    ),
    (
        'Vaccination',
        'vaccination',
        'Veterinary vaccination visit. The clinic will confirm the appropriate vaccine and schedule.',
        'Routine vaccination',
        'Preventive Care',
        NULL,
        NULL,
        NULL,
        NULL,
        true,
        true,
        20,
        'syringe'
    )
ON CONFLICT (slug) DO NOTHING;