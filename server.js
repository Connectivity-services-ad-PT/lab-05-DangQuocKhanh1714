const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8000;

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'core_user',
    password: process.env.DB_PASSWORD || 'core_pass',
    database: process.env.DB_NAME || 'core_business',
});

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
    let dbStatus = 'healthy';
    try {
        await pool.query('SELECT 1');
    } catch (err) {
        dbStatus = 'unhealthy';
    }
    res.json({
        status: 'healthy',
        service: 'core-business',
        db: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// POST /access/check
app.post('/access/check', async (req, res) => {
    const { cardId, gateId, timestamp, idempotencyKey } = req.body;

    // Validation
    if (!cardId) {
        return res.status(422).json({
            type: 'https://campus.local/errors/validation',
            title: 'Validation error',
            status: 422,
            detail: 'cardId is required'
        });
    }

    if (cardId.length < 1 || cardId.length > 50) {
        return res.status(422).json({
            type: 'https://campus.local/errors/validation',
            title: 'Validation error',
            status: 422,
            detail: 'cardId must be between 1 and 50 characters'
        });
    }

    // Business logic
    const decision = cardId === 'CARD_001' ? 'ALLOW' : 'DENY';
    const reasonCode = decision === 'ALLOW' ? 'VALID_CARD' : 'CARD_NOT_FOUND';
    const policyId = 'POL_ACCESS_EMPLOYEE';
    const decisionId = `dec-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

    // Save to database
    try {
        await pool.query(
            `INSERT INTO decisions (decision_id, card_id, gate_id, decision, reason_code, policy_id, evaluated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [decisionId, cardId, gateId, decision, reasonCode, policyId, new Date().toISOString()]
        );
    } catch (err) {
        console.error('Database error:', err);
    }

    res.json({
        decision: decision,
        reasonCode: reasonCode,
        policyId: policyId,
        decisionId: decisionId,
        evaluatedAt: new Date().toISOString(),
        traceId: `trace-${Date.now()}`
    });
});

// GET /policies/access/{policyId}
app.get('/policies/access/:policyId', async (req, res) => {
    const { policyId } = req.params;

    try {
        const result = await pool.query(
            'SELECT policy_id, name, effect, priority, description FROM policies WHERE policy_id = $1',
            [policyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                type: 'https://campus.local/errors/not-found',
                title: 'Policy not found',
                status: 404,
                detail: `Policy ${policyId} does not exist`
            });
        }

        const policy = result.rows[0];
        res.json({
            policyId: policy.policy_id,
            name: policy.name,
            effect: policy.effect,
            priority: policy.priority,
            description: policy.description
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /decisions/{decisionId}
app.get('/decisions/:decisionId', async (req, res) => {
    const { decisionId } = req.params;

    try {
        const result = await pool.query(
            'SELECT decision_id, card_id, gate_id, decision, reason_code, policy_id, evaluated_at FROM decisions WHERE decision_id = $1',
            [decisionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                type: 'https://campus.local/errors/not-found',
                title: 'Decision not found',
                status: 404,
                detail: `Decision ${decisionId} does not exist`
            });
        }

        const decision = result.rows[0];
        res.json({
            decisionId: decision.decision_id,
            policyId: decision.policy_id,
            subjectId: decision.card_id,
            decision: decision.decision,
            timestamp: decision.evaluated_at,
            gateId: decision.gate_id
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Core Business API running on port ${PORT}`);
});