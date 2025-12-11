const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Get all pending catches for review
router.get('/catches/pending', authenticateAdmin, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT
                c.id,
                c.user_id,
                u.username,
                u.fraud_score,
                c.tournament_id,
                t.name as tournament_name,
                c.photo_url,
                c.video_url,
                c.species,
                c.length_inches,
                c.status,
                c.fraud_signals,
                c.timestamp_capture,
                ST_AsText(c.gps_capture) as gps_location,
                cs.verification_code,
                ST_AsText(cs.gps_start) as gps_start
            FROM catches c
            JOIN users u ON c.user_id = u.id
            JOIN tournaments t ON c.tournament_id = t.id
            LEFT JOIN catch_sessions cs ON c.session_id = cs.id
            WHERE c.status IN ('pending', 'under_review')
            ORDER BY
                CASE c.status
                    WHEN 'under_review' THEN 1
                    WHEN 'pending' THEN 2
                END,
                c.timestamp_capture DESC`,
            []
        );

        res.json({
            pending_catches: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        next(error);
    }
});

// Get catch details for review
router.get('/catches/:id', authenticateAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT
                c.*,
                u.username,
                u.email,
                u.fraud_score,
                u.verified_angler,
                t.name as tournament_name,
                ST_AsText(c.gps_capture) as gps_location,
                cs.verification_code,
                ST_AsText(cs.gps_start) as gps_start,
                ST_AsText(t.region_boundaries) as tournament_boundaries
            FROM catches c
            JOIN users u ON c.user_id = u.id
            JOIN tournaments t ON c.tournament_id = t.id
            LEFT JOIN catch_sessions cs ON c.session_id = cs.id
            WHERE c.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Catch not found' });
        }

        // Get user's catch history
        const historyResult = await query(
            `SELECT
                COUNT(*) as total_catches,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_catches,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_catches
            FROM catches
            WHERE user_id = $1`,
            [result.rows[0].user_id]
        );

        res.json({
            catch: result.rows[0],
            user_history: historyResult.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// Approve catch
router.post('/catches/:id/approve', authenticateAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        // Update catch status
        const result = await query(
            `UPDATE catches
             SET status = 'accepted', updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Catch not found' });
        }

        // TODO: Send notification to user
        // TODO: Invalidate leaderboard cache

        res.json({
            message: 'Catch approved',
            catch: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// Reject catch
router.post('/catches/:id/reject', authenticateAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        // Update catch status
        const result = await query(
            `UPDATE catches
             SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [reason, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Catch not found' });
        }

        // TODO: Send notification to user
        // TODO: Update user fraud score if applicable

        res.json({
            message: 'Catch rejected',
            catch: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// Get user details
router.get('/users/:id', authenticateAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT
                u.*,
                w.balance as wallet_balance,
                COUNT(DISTINCT tp.tournament_id) as tournaments_entered,
                COUNT(DISTINCT c.id) as total_catches,
                COUNT(DISTINCT CASE WHEN c.status = 'accepted' THEN c.id END) as accepted_catches,
                COUNT(DISTINCT CASE WHEN c.status = 'rejected' THEN c.id END) as rejected_catches
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            LEFT JOIN tournament_participants tp ON u.id = tp.user_id
            LEFT JOIN catches c ON u.id = c.user_id
            WHERE u.id = $1
            GROUP BY u.id, w.balance`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get recent catches
        const catchesResult = await query(
            `SELECT
                c.id,
                c.tournament_id,
                t.name as tournament_name,
                c.species,
                c.length_inches,
                c.status,
                c.timestamp_capture
            FROM catches c
            JOIN tournaments t ON c.tournament_id = t.id
            WHERE c.user_id = $1
            ORDER BY c.timestamp_capture DESC
            LIMIT 20`,
            [id]
        );

        // Check for bans
        const bansResult = await query(
            'SELECT * FROM bans WHERE user_id = $1 ORDER BY created_at DESC',
            [id]
        );

        res.json({
            user: result.rows[0],
            recent_catches: catchesResult.rows,
            bans: bansResult.rows
        });
    } catch (error) {
        next(error);
    }
});

// Ban user
router.post('/users/:id/ban', authenticateAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason, ban_type, duration_days } = req.body;

        if (!reason || !ban_type) {
            return res.status(400).json({
                error: 'reason and ban_type are required'
            });
        }

        if (!['temporary', 'permanent'].includes(ban_type)) {
            return res.status(400).json({
                error: 'ban_type must be "temporary" or "permanent"'
            });
        }

        let expiresAt = null;
        if (ban_type === 'temporary') {
            if (!duration_days) {
                return res.status(400).json({
                    error: 'duration_days is required for temporary bans'
                });
            }
            expiresAt = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000);
        }

        // Create ban record
        const result = await query(
            `INSERT INTO bans (user_id, reason, ban_type, expires_at, banned_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [id, reason, ban_type, expiresAt, req.admin.id]
        );

        res.json({
            message: 'User banned successfully',
            ban: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// Get dashboard statistics
router.get('/stats/dashboard', authenticateAdmin, async (req, res, next) => {
    try {
        // Total users
        const usersResult = await query('SELECT COUNT(*) as total_users FROM users');

        // Active tournaments
        const tournamentsResult = await query(
            `SELECT COUNT(*) as active_tournaments
             FROM tournaments
             WHERE status IN ('open', 'active')`
        );

        // Pending catches
        const pendingResult = await query(
            `SELECT COUNT(*) as pending_catches
             FROM catches
             WHERE status IN ('pending', 'under_review')`
        );

        // Catches today
        const todayResult = await query(
            `SELECT COUNT(*) as catches_today
             FROM catches
             WHERE DATE(timestamp_capture) = CURRENT_DATE`
        );

        res.json({
            total_users: parseInt(usersResult.rows[0].total_users),
            active_tournaments: parseInt(tournamentsResult.rows[0].active_tournaments),
            pending_catches: parseInt(pendingResult.rows[0].pending_catches),
            catches_today: parseInt(todayResult.rows[0].catches_today)
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
