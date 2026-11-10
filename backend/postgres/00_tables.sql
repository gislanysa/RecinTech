CREATE TYPE startup_stage AS enum ('traction', 'scaling');

CREATE TABLE segment (
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE startup (
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    stage startup_stage NOT NULL DEFAULT 'traction',
    email text UNIQUE NOT NULL CHECK (email LIKE '%@%'),
    password_hash text NOT NULL,
    cnpj text UNIQUE NOT NULL CHECK (length(cnpj) = 14),
    description text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    website text NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX idx_startup_cnpj ON startup (cnpj);

CREATE INDEX idx_startup_email ON startup (email);

CREATE TYPE lgpd_consent AS enum ('granted', 'revoked');

CREATE TABLE lgpd_policy (
    version integer PRIMARY KEY CHECK (version > 0),
    document_url text NOT NULL,
    document_hash text NOT NULL,
    published_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_current boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX idx_lgpd_policy_current ON lgpd_policy (is_current)
WHERE
    is_current;

CREATE TABLE startup_lgpd_consent (
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    consent lgpd_consent NOT NULL,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    policy_version integer NOT NULL REFERENCES lgpd_policy (version),
    PRIMARY KEY(startup_id, policy_version)
);

CREATE TABLE startup_lgpd_consent_event (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    consent lgpd_consent NOT NULL,
    policy_version integer NOT NULL REFERENCES lgpd_policy (version),
    occurred_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_startup_lgpd_consent_event_subject_time ON startup_lgpd_consent_event (startup_id, occurred_at);

CREATE TYPE company_size AS enum ('micro', 'small', 'medium', 'big');

CREATE TABLE company (
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    size company_size NOT NULL DEFAULT 'micro',
    email text UNIQUE NOT NULL CHECK (email LIKE '%@%'),
    cnpj text UNIQUE NOT NULL CHECK (length(cnpj) = 14),
    password_hash text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active boolean NOT NULL DEFAULT TRUE,
    website text NOT NULL DEFAULT '',
    PRIMARY KEY(id)
);

CREATE INDEX idx_company_email ON company (email);

CREATE TYPE connection_status_enum AS enum ('pending', 'accepted', 'declined');

CREATE TABLE company_startup_connection (
    company_id uuid NOT NULL REFERENCES company (id) ON DELETE CASCADE,
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    connection_status connection_status_enum NOT NULL DEFAULT 'pending',
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, startup_id)
);

CREATE INDEX idx_company_startup_connection_company ON company_startup_connection (company_id);

CREATE INDEX idx_company_startup_connection_startup ON company_startup_connection (startup_id);

CREATE TABLE company_lgpd_consent (
    company_id uuid NOT NULL REFERENCES company (id) ON DELETE CASCADE,
    consent lgpd_consent NOT NULL,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    policy_version integer NOT NULL REFERENCES lgpd_policy (version),
    PRIMARY KEY(company_id, policy_version)
);

CREATE INDEX idx_company_lgpd_consent_company ON company_lgpd_consent (company_id);

CREATE INDEX idx_company_lgpd_consent_consent ON company_lgpd_consent (consent);

CREATE TABLE company_lgpd_consent_event (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    company_id uuid NOT NULL REFERENCES company (id) ON DELETE CASCADE,
    consent lgpd_consent NOT NULL,
    policy_version integer NOT NULL REFERENCES lgpd_policy (version),
    occurred_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_lgpd_consent_event_subject_time ON company_lgpd_consent_event (company_id, occurred_at);

CREATE TABLE startup_segment (
    startup_id uuid REFERENCES startup (id) ON DELETE CASCADE,
    segment_id uuid REFERENCES segment (id) ON DELETE CASCADE,
    PRIMARY KEY(startup_id, segment_id)
);

CREATE INDEX idx_startup_segment_startup ON startup_segment (startup_id);

CREATE INDEX idx_startup_segment_segment ON startup_segment (segment_id);

CREATE TABLE company_segment (
    company_id uuid REFERENCES company (id) ON DELETE CASCADE,
    segment_id uuid REFERENCES segment (id) ON DELETE CASCADE,
    PRIMARY KEY(company_id, segment_id)
);

CREATE INDEX idx_company_segment_company ON company_segment (company_id);

CREATE INDEX idx_company_segment_segment ON company_segment (segment_id);

CREATE TABLE expertise(
    id uuid DEFAULT uuidv7(),
    name text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE startup_expertise (
    startup_id uuid REFERENCES startup (id) ON DELETE CASCADE,
    expertise_id uuid REFERENCES expertise (id) ON DELETE CASCADE,
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
    startup_id uuid REFERENCES startup (id) ON DELETE CASCADE,
    service_id uuid REFERENCES service (id) ON DELETE CASCADE,
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
    startup_id uuid REFERENCES startup (id) ON DELETE CASCADE,
    technology_id uuid REFERENCES technology (id) ON DELETE CASCADE,
    PRIMARY KEY(startup_id, technology_id)
);

CREATE INDEX idx_startup_technology_startup_id ON startup_technology (startup_id);

CREATE INDEX idx_startup_technology_technology_id ON startup_technology (technology_id);

CREATE TYPE demand_status AS enum ('open', 'closed', 'canceled');

CREATE TABLE demand (
    id uuid DEFAULT uuidv7(),
    company_id uuid NOT NULL REFERENCES company (id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    demand_status demand_status NOT NULL DEFAULT 'open',
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX idx_demand_company ON demand (company_id);

CREATE INDEX idx_demand_status ON demand (demand_status);

CREATE TABLE demand_segment (
    demand_id uuid NOT NULL REFERENCES demand (id) ON DELETE CASCADE,
    segment_id uuid NOT NULL REFERENCES segment (id) ON DELETE CASCADE,
    PRIMARY KEY (demand_id, segment_id)
);

CREATE INDEX idx_demand_segment_demand ON demand_segment (demand_id);

CREATE INDEX idx_demand_segment_segment ON demand_segment (segment_id);

CREATE TABLE demand_expertise (
    demand_id uuid NOT NULL REFERENCES demand (id) ON DELETE CASCADE,
    expertise_id uuid NOT NULL REFERENCES expertise (id) ON DELETE CASCADE,
    PRIMARY KEY (demand_id, expertise_id)
);

CREATE INDEX idx_demand_expertise_demand ON demand_expertise (demand_id);

CREATE INDEX idx_demand_expertise_expertise ON demand_expertise (expertise_id);

CREATE TABLE demand_service (
    demand_id uuid NOT NULL REFERENCES demand (id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES service (id) ON DELETE CASCADE,
    PRIMARY KEY (demand_id, service_id)
);

CREATE INDEX idx_demand_service_demand ON demand_service (demand_id);

CREATE INDEX idx_demand_service_service ON demand_service (service_id);

CREATE TABLE demand_technology (
    demand_id uuid NOT NULL REFERENCES demand (id) ON DELETE CASCADE,
    technology_id uuid NOT NULL REFERENCES technology (id) ON DELETE CASCADE,
    PRIMARY KEY (demand_id, technology_id)
);

CREATE INDEX idx_demand_technology_demand ON demand_technology (demand_id);

CREATE INDEX idx_demand_technology_technology ON demand_technology (technology_id);
