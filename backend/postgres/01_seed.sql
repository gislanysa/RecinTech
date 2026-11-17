-- dummy lgpd policy
INSERT INTO
    lgpd_policy (version, document_url, document_hash, is_current)
VALUES
    (
        1,
        'http://localhost:3000/privacidade',
        repeat('0', 64),
        TRUE
    );

-- Catalogo: segment
INSERT INTO public.segment (name, description)
SELECT name, description FROM (VALUES
    ('Agritech', 'Tecnologia no agronegócio'),
    ('Cleantech / Sustentabilidade', 'Tecnologias limpas e sustentabilidade'),
    ('Edtech', 'Tecnologia na educação'),
    ('Fintech', 'Tecnologia em serviços financeiros'),
    ('Healthtech / Medtech', 'Tecnologia na saúde e medicina'),
    ('Legaltech', 'Tecnologia no setor jurídico'),
    ('Logtech', 'Tecnologia em logística e transporte'),
    ('Marketplace', 'Plataformas de marketplace'),
    ('Proptech', 'Tecnologia no mercado imobiliário'),
    ('Retailtech', 'Tecnologia para o varejo'),
    ('Saas / Software', 'Software como serviço e desenvolvimento de software'),
    ('Segurança da Informação', 'Segurança digital e privacidade'),
    ('Inteligência Artificial', 'Tecnologias e produtos baseados em IA'),
    ('Outro', 'Outros segmentos de mercado')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.segment s WHERE s.name = v.name);

-- Catalogo: service
INSERT INTO public.service (name, description)
SELECT name, description FROM (VALUES
    ('Desenvolvimento Web', 'Serviço de Desenvolvimento Web'),
    ('Desenvolvimento Mobile', 'Serviço de Desenvolvimento Mobile'),
    ('UX/UI Design', 'Design de Interfaces e Experiência do Usuário'),
    ('Inteligência Artificial', 'Soluções em Inteligência Artificial'),
    ('Automação', 'Automação de Processos'),
    ('Análise de Dados', 'Análise e Ciência de Dados'),
    ('Marketing Digital', 'Estratégias de Marketing Digital'),
    ('Consultoria', 'Consultoria Especializada'),
    ('Outros', 'Outros serviços especializados')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.service s WHERE s.name = v.name);

-- Catalogo: technology
INSERT INTO public.technology (name, description)
SELECT name, description FROM (VALUES
    ('React', 'Biblioteca React'),
    ('React Native', 'Framework mobile React Native'),
    ('Node.js', 'Ambiente de execução Node.js'),
    ('Python', 'Linguagem Python'),
    ('Java', 'Linguagem Java'),
    ('JavaScript', 'Linguagem JavaScript'),
    ('TypeScript', 'Linguagem TypeScript'),
    ('PostgreSQL', 'Banco de dados PostgreSQL'),
    ('MySQL', 'Banco de dados MySQL'),
    ('AWS', 'Serviços em nuvem Amazon Web Services'),
    ('Docker', 'Containers Docker'),
    ('Outras', 'Outras tecnologias e ferramentas')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.technology s WHERE s.name = v.name);

-- Catalogo: expertise
INSERT INTO public.expertise (name, description)
SELECT name, description FROM (VALUES
    ('Tecnologia', 'Área de atuação em Tecnologia'),
    ('Saúde', 'Área de atuação em Saúde'),
    ('Educação', 'Área de atuação em Educação'),
    ('Finanças', 'Área de atuação em Finanças'),
    ('Marketing', 'Área de atuação em Marketing'),
    ('Varejo', 'Área de atuação em Varejo'),
    ('Sustentabilidade', 'Área de atuação em Sustentabilidade'),
    ('Outros', 'Outras áreas de atuação')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.expertise s WHERE s.name = v.name);
