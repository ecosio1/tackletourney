const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user profile
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT
                u.id,
                u.email,
                u.username,
                u.region,
                u.favorite_species,
                u.verified_angler,
                u.created_at,
                w.balance as wallet_balance,
                COUNT(DISTINCT tp.tournament_id) as tournaments_entered,
                COUNT(DISTINCT c.id) as total_catches
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            LEFT JOIN tournament_participants tp ON u.id = tp.user_id
            LEFT JOIN catches c ON u.id = c.user_id
            WHERE u.id = $1
            GROUP BY u.id, w.balance`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// Get user's tournaments
router.get('/me/tournaments', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let queryText = `
            SELECT
                t.id,
                t.name,
                t.species,
                t.start_time,
                t.end_time,
                t.entry_fee,
                t.status,
                tp.joined_at,
                COUNT(c.id) as my_catches,
                MAX(c.length_inches) as my_best_catch
            FROM tournament_participants tp
            JOIN tournaments t ON tp.tournament_id = t.id
            LEFT JOIN catches c ON c.tournament_id = t.id AND c.user_id = tp.user_id AND c.status = 'accepted'
            WHERE tp.user_id = $1
        `;

        const params = [userId];

        if (status) {
            queryText += ` AND t.status = $2`;
            params.push(status);
        }

        queryText += `
            GROUP BY t.id, tp.joined_at
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

// Get user's catch history
router.get('/me/catches', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { tournament_id } = req.query;

        let queryText = `
            SELECT
                c.id,
                c.tournament_id,
                t.name as tournament_name,
                c.species,
                c.length_inches,
                c.photo_url,
                c.status,
                c.timestamp_capture,
                c.rejection_reason
            FROM catches c
            JOIN tournaments t ON c.tournament_id = t.id
            WHERE c.user_id = $1
        `;

        const params = [userId];

        if (tournament_id) {
            queryText += ` AND c.tournament_id = $2`;
            params.push(tournament_id);
        }

        queryText += ` ORDER BY c.timestamp_capture DESC LIMIT 50`;

        const result = await query(queryText, params);

        res.json({
            catches: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        next(error);
    }
});

// Get wallet balance
router.get('/me/wallet', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await query(
            'SELECT balance, updated_at FROM wallets WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
