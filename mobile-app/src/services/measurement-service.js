/**
 * Fish Measurement Service - Roboflow Computer Vision Integration
 *
 * This service provides tournament-grade fish measurement using:
 * - Roboflow Inference API for object detection
 * - ArUco marker reference objects for scale calibration
 * - Confidence scoring and validation
 *
 * Replaces local-measurement.js with production CV capabilities.
 */

import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Configuration from .env
const ROBOFLOW_API_KEY = Constants.expoConfig?.extra?.ROBOFLOW_API_KEY || 'your_api_key_here';
const ROBOFLOW_MODEL_ID = Constants.expoConfig?.extra?.ROBOFLOW_MODEL_ID || 'fish-measurement-v1';
const ROBOFLOW_VERSION = Constants.expoConfig?.extra?.ROBOFLOW_VERSION || '1';
const CONFIDENCE_THRESHOLD = parseFloat(Constants.expoConfig?.extra?.MEASUREMENT_CONFIDENCE_THRESHOLD) || 0.70;
const ARUCO_MARKER_SIZE_INCHES = parseFloat(Constants.expoConfig?.extra?.ARUCO_MARKER_SIZE_INCHES) || 4.0;

// Roboflow API endpoint
const ROBOFLOW_API_URL = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_VERSION}`;

/**
 * Main entry point for fish measurement
 * Maintains same signature as local-measurement.js for seamless integration
 */
export async function analyzeCatchPhoto({ photoUri, tournamentId }) {
  const startedAt = new Date().toISOString();

  // Validate inputs
  if (!photoUri) {
    return {
      status: 'error',
      version: 'roboflow-v1',
      startedAt,
      completedAt: new Date().toISOString(),
      measuredLengthIn: null,
      confidence: 0,
      flags: ['NO_PHOTO'],
      referenceObject: null,
    };
  }

  // Check network connectivity
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) {
    console.log('[MeasurementService] Offline - queueing for later');
    return createOfflineResponse(startedAt);
  }

  // Web platform fallback to local measurement
  if (Platform.OS === 'web') {
    console.log('[MeasurementService] Web platform - using local estimation');
    const { analyzeCatchPhoto: localAnalyze } = await import('./local-measurement.js');
    return localAnalyze({ photoUri, tournamentId });
  }

  try {
    // Upload photo and get Roboflow detection
    const detectionResult = await uploadAndDetect(photoUri);

    // Parse detection results
    const measurement = await processMeasurement(detectionResult, startedAt);

    return measurement;

  } catch (error) {
    console.error('[MeasurementService] Error:', error);
    return {
      status: 'error',
      version: 'roboflow-v1',
      startedAt,
      completedAt: new Date().toISOString(),
      measuredLengthIn: null,
      confidence: 0,
      flags: ['MEASUREMENT_ERROR', error.message],
      referenceObject: null,
    };
  }
}

/**
 * Upload photo to Roboflow and get object detection results
 */
async function uploadAndDetect(photoUri) {
  try {
    // Read photo file as base64
    const base64Image = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Call Roboflow Inference API
    const response = await axios({
      method: 'POST',
      url: ROBOFLOW_API_URL,
      params: {
        api_key: ROBOFLOW_API_KEY,
        confidence: 0.40, // Lower threshold for detection, we'll filter later
      },
      data: base64Image,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000, // 15 second timeout
    });

    return response.data;

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('API_TIMEOUT');
    } else if (error.response?.status === 401) {
      throw new Error('INVALID_API_KEY');
    } else if (error.response?.status === 404) {
      throw new Error('MODEL_NOT_FOUND');
    } else {
      throw new Error('NETWORK_ERROR');
    }
  }
}

/**
 * Process Roboflow detection results into measurement object
 */
async function processMeasurement(detectionResult, startedAt) {
  const completedAt = new Date().toISOString();
  const flags = [];

  // Extract predictions
  const predictions = detectionResult.predictions || [];

  // Find ArUco marker (reference object)
  const markerDetection = predictions.find(p =>
    p.class === 'aruco_marker' || p.class === 'marker' || p.class === 'reference'
  );

  // Find fish
  const fishDetections = predictions.filter(p =>
    p.class === 'fish' || p.class.toLowerCase().includes('fish')
  );

  // Validate reference object
  if (!markerDetection) {
    flags.push('NO_REFERENCE_FOUND');
    return {
      status: 'error',
      version: 'roboflow-v1',
      startedAt,
      completedAt,
      measuredLengthIn: null,
      confidence: 0,
      flags,
      referenceObject: {
        type: 'aruco',
        detected: false,
        confidence: 0,
        size: ARUCO_MARKER_SIZE_INCHES,
      },
    };
  }

  // Validate fish detection
  if (fishDetections.length === 0) {
    flags.push('FISH_NOT_DETECTED');
    return {
      status: 'error',
      version: 'roboflow-v1',
      startedAt,
      completedAt,
      measuredLengthIn: null,
      confidence: 0,
      flags,
      referenceObject: {
        type: 'aruco',
        detected: true,
        confidence: markerDetection.confidence,
        size: ARUCO_MARKER_SIZE_INCHES,
      },
    };
  }

  // Flag multiple fish
  if (fishDetections.length > 1) {
    flags.push('MULTIPLE_FISH');
  }

  // Use the fish with highest confidence
  const fishDetection = fishDetections.reduce((prev, current) =>
    (current.confidence > prev.confidence) ? current : prev
  );

  // Calculate pixel-to-inch ratio from marker
  const pixelRatio = calculatePixelRatio(markerDetection);

  // Measure fish length
  const fishLengthPixels = calculateFishLength(fishDetection);
  const fishLengthInches = (fishLengthPixels / pixelRatio).toFixed(2);

  // Compute overall confidence score
  const overallConfidence = computeConfidence(
    fishDetection.confidence,
    markerDetection.confidence,
    flags
  );

  // Determine status
  let status = 'ok';
  if (overallConfidence < CONFIDENCE_THRESHOLD) {
    status = 'low_confidence';
    flags.push('LOW_CONFIDENCE');
  }

  // Check for marker clarity
  if (markerDetection.confidence < 0.80) {
    flags.push('MARKER_UNCLEAR');
  }

  // Check for fish clarity
  if (fishDetection.confidence < 0.60) {
    flags.push('HEAD_TAIL_UNCLEAR');
  }

  return {
    status,
    version: 'roboflow-v1',
    startedAt,
    completedAt,
    measuredLengthIn: parseFloat(fishLengthInches),
    confidence: parseFloat(overallConfidence.toFixed(2)),
    flags,
    referenceObject: {
      type: 'aruco',
      detected: true,
      confidence: parseFloat(markerDetection.confidence.toFixed(2)),
      size: ARUCO_MARKER_SIZE_INCHES,
    },
  };
}

/**
 * Calculate pixel-to-inch ratio from ArUco marker bounding box
 */
function calculatePixelRatio(markerDetection) {
  // Marker bounding box dimensions
  const markerWidth = markerDetection.width;
  const markerHeight = markerDetection.height;

  // Use average of width/height for more robust ratio
  const markerSizePixels = (markerWidth + markerHeight) / 2;

  // Known physical size of marker (4x4 inches)
  const pixelsPerInch = markerSizePixels / ARUCO_MARKER_SIZE_INCHES;

  return pixelsPerInch;
}

/**
 * Calculate fish length in pixels from bounding box
 */
function calculateFishLength(fishDetection) {
  // Fish bounding box
  const fishWidth = fishDetection.width;
  const fishHeight = fishDetection.height;

  // Assume fish is oriented horizontally (width = length)
  // In future, could use keypoint detection for head/tail points
  const fishLengthPixels = Math.max(fishWidth, fishHeight);

  return fishLengthPixels;
}

/**
 * Compute overall confidence score
 * Combines fish detection confidence, marker confidence, and validation flags
 */
function computeConfidence(fishConfidence, markerConfidence, flags) {
  // Base confidence is weighted average
  let confidence = (fishConfidence * 0.7) + (markerConfidence * 0.3);

  // Penalize for multiple fish
  if (flags.includes('MULTIPLE_FISH')) {
    confidence *= 0.85;
  }

  // Penalize for unclear marker
  if (flags.includes('MARKER_UNCLEAR')) {
    confidence *= 0.90;
  }

  // Penalize for unclear fish
  if (flags.includes('HEAD_TAIL_UNCLEAR')) {
    confidence *= 0.90;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Create response for offline scenario
 */
function createOfflineResponse(startedAt) {
  return {
    status: 'error',
    version: 'roboflow-v1',
    startedAt,
    completedAt: new Date().toISOString(),
    measuredLengthIn: null,
    confidence: 0,
    flags: ['OFFLINE', 'MEASUREMENT_QUEUED'],
    referenceObject: null,
  };
}

/**
 * Validate API configuration
 */
export function validateConfig() {
  const issues = [];

  if (!ROBOFLOW_API_KEY || ROBOFLOW_API_KEY === 'your_api_key_here') {
    issues.push('ROBOFLOW_API_KEY not configured in .env');
  }

  if (!ROBOFLOW_MODEL_ID) {
    issues.push('ROBOFLOW_MODEL_ID not configured');
  }

  return {
    valid: issues.length === 0,
    issues,
    config: {
      apiKey: ROBOFLOW_API_KEY ? '***' + ROBOFLOW_API_KEY.slice(-4) : 'NOT SET',
      modelId: ROBOFLOW_MODEL_ID,
      version: ROBOFLOW_VERSION,
      confidenceThreshold: CONFIDENCE_THRESHOLD,
      markerSize: ARUCO_MARKER_SIZE_INCHES,
    },
  };
}
