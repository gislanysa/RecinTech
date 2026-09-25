CREATE TYPE startup_stage AS enum ('seed', 'growth');

CREATE TYPE investor_kind AS enum (
    'angel',
    'venture',
    'individual',
    'institutional'
);

CREATE TABLE user_account (
    id uuid DEFAULT uuidv7(),
    full_name text NOT NULL,
    password_hash text NOT NULL,
    email text UNIQUE NOT NULL CHECK (email LIKE '%@%'),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active boolean NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);

CREATE INDEX idx_user_account_email ON user_account (email);

CREATE TABLE segment (
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE startup (
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    stage startup_stage NOT NULL DEFAULT 'seed',
    cnpj text UNIQUE NOT NULL CHECK (length(cnpj) = 14),
    description text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX idx_startup_cnpj ON startup (cnpj);

CREATE TABLE startup_membership (
    user_id uuid REFERENCES user_account (id) ON DELETE CASCADE,
    startup_id uuid REFERENCES startup (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, startup_id)
);

CREATE INDEX idx_startup_membership_user_account_id ON startup_membership (user_id);

CREATE INDEX idx_startup_membership_startup_id ON startup_membership (startup_id);

CREATE TABLE investor (
    id uuid NOT NULL REFERENCES user_account (id) ON DELETE CASCADE,
    kind investor_kind NOT NULL,
    public_profile boolean NOT NULL DEFAULT TRUE,
    PRIMARY KEY(id)
);

CREATE INDEX idx_investor_user_id ON investor (id);

CREATE TABLE startup_segment (
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    segment_id uuid NOT NULL REFERENCES segment (id) ON DELETE CASCADE,
    is_main_segment boolean NOT NULL DEFAULT false,
    PRIMARY KEY(startup_id, segment_id)
);

CREATE INDEX idx_startup_segment_startup ON startup_segment (startup_id);

CREATE INDEX idx_startup_segment_segment ON startup_segment (segment_id);

CREATE TABLE investor_segment (
    investor_id uuid NOT NULL REFERENCES investor (id) ON DELETE CASCADE,
    segment_id uuid NOT NULL REFERENCES segment (id) ON DELETE CASCADE,
    PRIMARY KEY(investor_id, segment_id)
);

CREATE INDEX idx_investor_segment_investor ON investor_segment (investor_id);

CREATE INDEX idx_investor_segment_segment ON investor_segment (segment_id);

CREATE TABLE expertise(
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE startup_expertise (
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    expertise_id uuid NOT NULL REFERENCES expertise (id) ON DELETE CASCADE,
    PRIMARY KEY(startup_id, expertise_id)
);

CREATE INDEX idx_startup_expertise_startup_id ON startup_expertise (startup_id);

CREATE INDEX idx_startup_expertise_expertise_id ON startup_expertise (expertise_id);

CREATE TABLE service(
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE startup_service (
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES service (id) ON DELETE CASCADE,
    PRIMARY KEY(startup_id, service_id)
);

CREATE INDEX idx_startup_service_startup_id ON startup_service (startup_id);

CREATE INDEX idx_startup_service_service_id ON startup_service (service_id);

CREATE TABLE technology(
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE startup_technology (
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    technology_id uuid NOT NULL REFERENCES technology (id) ON DELETE CASCADE,
    PRIMARY KEY(startup_id, technology_id)
);

CREATE INDEX idx_startup_technology_startup_id ON startup_technology (startup_id);

CREATE INDEX idx_startup_technology_technology_id ON startup_technology (technology_id);
