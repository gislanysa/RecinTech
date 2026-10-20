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
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active boolean NOT NULL DEFAULT TRUE,
    website text NOT NULL DEFAULT '',
    PRIMARY KEY (id)
);

CREATE INDEX idx_startup_cnpj ON startup (cnpj);

CREATE INDEX idx_startup_email ON startup (email);

CREATE TYPE lgpd_consent AS enum ('granted', 'revoked');

CREATE TABLE startup_lgpd_consent (
    startup_id uuid NOT NULL REFERENCES startup (id) ON DELETE CASCADE,
    consent lgpd_consent NOT NULL DEFAULT 'revoked',
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    policy_version integer NOT NULL CHECK (policy_version > 0),
    PRIMARY KEY(startup_id, policy_version)
);

CREATE INDEX idx_startup_lgpd_consent_startup ON startup_lgpd_consent (startup_id);

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
    is_active boolean NOT NULL DEFAULT TRUE,
    website text NOT NULL DEFAULT '',
    PRIMARY KEY(id)
);

CREATE INDEX idx_company_email ON company (email);

CREATE TABLE company_lgpd_consent (
    company_id uuid NOT NULL REFERENCES company (id) ON DELETE CASCADE,
    consent lgpd_consent NOT NULL DEFAULT 'revoked',
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    policy_version integer NOT NULL CHECK (policy_version > 0),
    PRIMARY KEY(company_id, policy_version)
);

CREATE INDEX idx_company_lgpd_consent_company ON company_lgpd_consent (company_id);

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
