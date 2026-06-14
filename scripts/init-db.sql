CREATE TABLE IF NOT EXISTS decisions (
    id SERIAL PRIMARY KEY,
    decision_id VARCHAR(100) UNIQUE NOT NULL,
    card_id VARCHAR(50) NOT NULL,
    gate_id VARCHAR(50) NOT NULL,
    decision VARCHAR(10) NOT NULL,
    reason_code VARCHAR(50),
    policy_id VARCHAR(100),
    evaluated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    effect VARCHAR(10) NOT NULL,
    priority INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO policies (policy_id, name, effect, priority, description)
VALUES ('POL_ACCESS_EMPLOYEE', 'Employee Access Policy', 'ALLOW', 10, 'Allow employees during working hours')
ON CONFLICT (policy_id) DO NOTHING;