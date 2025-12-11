const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/catches';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
});

// Helper function to generate unique verification code
function generateVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Start catch session - generates verification code
router.post('/sessions/start', authenticateToken, async (req, res, next) => {
    try {
        const { tournament_id, gps_lat, gps_lon } = req.body;
        const userId = req.user.id;

        if (!tournament_id || !gps_lat || !gps_lon) {
            return res.status(400).json({
                error: 'tournament_id, gps_lat, and gps_lon are required'
            });
        }

        // Verify user is participant
        const participantCheck = await query(
            'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
            [tournament_id, userId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You must join the tournament first' });
        }

        // Get tournament details
        const tournamentResult = await query(
            `SELECT *,
             ST_AsText(region_boundaries) as boundaries
             FROM tournaments WHERE id = $1`,
            [tournament_id]
        );

        if (tournamentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const tournament = tournamentResult.rows[0];

        // Check if tournament is active
        const now = new Date();
        if (now < new Date(tournament.start_time)) {
            return res.status(400).json({ error: 'Tournament has not started yet' });
        }
        if (now > new Date(tournament.end_time)) {
            return res.status(400).json({ error: 'Tournament has ended' });
        }

        // Check GPS is within boundaries (simplified check - in production use PostGIS ST_Contains)
        // For now, we'll just validate GPS is provided
        const gpsPoint = `POINT(${gps_lon} ${gps_lat})`;

        // TODO: Add proper PostGIS point-in-polygon check:
        // const boundaryCheck = await query(
        //     'SELECT ST_Contains(region_boundaries, ST_GeogFromText($1)) as is_within FROM tournaments WHERE id = $2',
        //     [gpsPoint, tournament_id]
        // );

        // Generate verification code
        const verification_code = generateVerificationCode();

        // Create session (expires in 10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const result = await query(
            `INSERT INTO catch_sessions
             (user_id, tournament_id, verification_code, gps_start, expires_at)
             VALUES ($1, $2, $3, ST_GeogFromText($4), $5)
             RETURNING id, verification_code, expires_at`,
            [userId, tournament_id, verification_code, gpsPoint, expiresAt]
        );

        res.json({
            message: 'Catch session started',
            session_id: result.rows[0].id,
            verification_code: result.rows[0].verification_code,
            expires_at: result.rows[0].expires_at
        });
    } catch (error) {
        next(error);
    }
});

// Submit catch
router.post('/', authenticateToken, upload.single('photo'), async (req, res, next) => {
    try {
        const {
            session_id,
            tournament_id,
            species,
            length_inches, // User-entered for Phase 1, will be CV-measured in Phase 3
            gps_lat,
            gps_lon
        } = req.body;

        const userId = req.user.id;

        if (!session_id || !tournament_id || !req.file || !gps_lat || !gps_lon) {
            return res.status(400).json({
                error: 'session_id, tournament_id, photo, gps_lat, and gps_lon are required'
            });
        }

        // Validate session
        const sessionResult = await query(
            `SELECT * FROM catch_sessions
             WHERE id = $1
             AND user_id = $2
             AND tournament_id = $3
             AND status = 'active'
             AND expires_at > NOW()`,
            [session_id, userId, tournament_id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(400).json({
                error: 'Invalid or expired session'
            });
        }

        // Mark session as used
        await query(
            'UPDATE catch_sessions SET status = $1 WHERE id = $2',
            ['used', session_id]
        );

        // Get tournament to validate time window
        const tournamentResult = await query(
            'SELECT * FROM tournaments WHERE id = $1',
            [tournament_id]
        );

        const tournament = tournamentResult.rows[0];
        const now = new Date();

        if (now < new Date(tournament.start_time) || now > new Date(tournament.end_time)) {
            return res.status(400).json({
                error: 'Catch submitted outside tournament time window'
            });
        }

        // Create catch record
        const photoUrl = `/uploads/catches/${req.file.filename}`;
        const gpsPoint = `POINT(${gps_lon} ${gps_lat})`;

        const catchResult = await query(
            `INSERT INTO catches
             (user_id, tournament_id, session_id, photo_url, gps_capture, timestamp_capture, species, length_inches, status)
             VALUES ($1, $2, $3, $4, ST_GeogFromText($5), NOW(), $6, $7, $8)
             RETURNING id, status, timestamp_capture`,
            [userId, tournament_id, session_id, photoUrl, gpsPoint, species, length_inches, 'pending']
        );

        const catchRecord = catchResult.rows[0];

        // TODO Phase 2-4: Queue for CV analysis and fraud detection
        // For Phase 1, all catches go to manual review (status: 'pending')

        res.status(201).json({
            message: 'Catch submitted successfully',
            catch: {
                id: catchRecord.id,
                status: catchRecord.status,
                timestamp: catchRecord.timestamp_capture
            }
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        next(error);
    }
});

// Get catch details
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT
                c.*,
                u.username,
                t.name as tournament_name,
                ST_AsText(c.gps_capture) as gps_location
            FROM catches c
            JOIN users u ON c.user_id = u.id
            JOIN tournaments t ON c.tournament_id = t.id
            WHERE c.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Catch not found' });
        }

        const catchData = result.rows[0];

        // Only owner or admin can view full details
        if (catchData.user_id !== req.user.id) {
            // Return limited public info
            return res.json({
                id: catchData.id,
                username: catchData.username,
                species: catchData.species,
                length_inches: catchData.length_inches,
                photo_url: catchData.photo_url,
                status: catchData.status,
                timestamp_capture: catchData.timestamp_capture
            });
        }

        res.json(catchData);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
