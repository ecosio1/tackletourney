const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all tournaments (public)
router.get('/', async (req, res, next) => {
    try {
        const { status, species } = req.query;

        let queryText = `
            SELECT
                t.id,
                t.name,
                t.species,
                ST_AsGeoJSON(t.region_boundaries) as region_boundaries,
                t.start_time,
                t.end_time,
                t.entry_fee,
                t.prize_structure,
                t.status,
                COUNT(DISTINCT tp.user_id) as participant_count,
                COALESCE(SUM(t.entry_fee), 0) as prize_pool
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        // Filter by status
        if (status) {
            queryText += ` AND t.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        } else {
            // By default, show active and open tournaments
            queryText += ` AND t.status IN ('open', 'active')`;
        }

        // Filter by species
        if (species) {
            queryText += ` AND $${paramCount} = ANY(t.species)`;
            params.push(species);
            paramCount++;
        }

        queryText += `
            GROUP BY t.id
            ORDER BY t.start_time DESC
        `;

        const result = await query(queryText, params);

        res.json({
            tournaments: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        next(error);
    }
});

// Get single tournament
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT
                t.id,
                t.name,
                t.species,
                ST_AsGeoJSON(t.region_boundaries) as region_boundaries,
                t.start_time,
                t.end_time,
                t.entry_fee,
                t.prize_structure,
                t.status,
                COUNT(DISTINCT tp.user_id) as participant_count,
                COALESCE(SUM(t.entry_fee), 0) as prize_pool
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            WHERE t.id = $1
            GROUP BY t.id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// Join tournament (requires authentication)
router.post('/:id/join', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get tournament details
        const tournamentResult = await query(
            'SELECT * FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const tournament = tournamentResult.rows[0];

        // Check if tournament is open
        if (tournament.status !== 'open' && tournament.status !== 'active') {
            return res.status(400).json({ error: 'Tournament is not open for registration' });
        }

        // Check if user already joined
        const existingParticipant = await query(
            'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingParticipant.rows.length > 0) {
            return res.status(409).json({ error: 'You have already joined this tournament' });
        }

        // For Phase 1, tournaments are free. Payment logic will be added in Phase 6
        // TODO: Add payment processing when entry_fee > 0

        // Add participant
        await query(
            'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2)',
            [id, userId]
        );

        res.json({
            message: 'Successfully joined tournament',
            tournament_id: id
        });
    } catch (error) {
        next(error);
    }
});

// Get tournament leaderboard
router.get('/:id/leaderboard', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT
                c.id,
                c.user_id,
                u.username,
                c.species,
                c.length_inches,
                c.photo_url,
                c.timestamp_capture,
                ST_AsText(c.gps_capture) as location,
                ROW_NUMBER() OVER (ORDER BY c.length_inches DESC, c.timestamp_capture ASC) as rank
            FROM catches c
            JOIN users u ON c.user_id = u.id
            WHERE c.tournament_id = $1
            AND c.status = 'accepted'
            ORDER BY c.length_inches DESC, c.timestamp_capture ASC`,
            [id]
        );

        res.json({
            tournament_id: id,
            leaderboard: result.rows,
            total_catches: result.rows.length
        });
    } catch (error) {
        next(error);
    }
});

// Get user's catches for tournament
router.get('/:id/my-catches', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await query(
            `SELECT
                c.id,
                c.species,
                c.length_inches,
                c.photo_url,
                c.status,
                c.timestamp_capture,
                c.rejection_reason
            FROM catches c
            WHERE c.tournament_id = $1
            AND c.user_id = $2
            ORDER BY c.timestamp_capture DESC`,
            [id, userId]
        );

        res.json({
            tournament_id: id,
            catches: result.rows
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
