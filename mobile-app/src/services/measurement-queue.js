/**
 * Measurement Queue Service
 *
 * Handles offline measurement queueing and retry logic.
 * When network is unavailable, measurements are queued and processed
 * when connectivity is restored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { analyzeCatchPhoto } from './measurement-service';

const QUEUE_STORAGE_KEY = '@fish_tourney_pending_measurements';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

/**
 * Queue a measurement for later processing
 */
export async function queueMeasurement(photoUri, tournamentId) {
  const queueItem = {
    id: `measurement_queue_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    photoUri,
    tournamentId,
    status: 'pending',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    result: null,
  };

  try {
    const queue = await getQueue();
    queue.push(queueItem);
    await saveQueue(queue);
    console.log('[MeasurementQueue] Queued:', queueItem.id);
    return queueItem;
  } catch (error) {
    console.error('[MeasurementQueue] Failed to queue:', error);
    throw error;
  }
}

/**
 * Process all pending measurements in the queue
 */
export async function processQueue() {
  try {
    // Check network
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('[MeasurementQueue] Offline - skipping queue processing');
      return { processed: 0, failed: 0, pending: 0 };
    }

    const queue = await getQueue();
    const pendingItems = queue.filter(item => item.status === 'pending');

    if (pendingItems.length === 0) {
      return { processed: 0, failed: 0, pending: 0 };
    }

    console.log(`[MeasurementQueue] Processing ${pendingItems.length} pending measurements`);

    let processed = 0;
    let failed = 0;

    for (const item of pendingItems) {
      try {
        // Attempt measurement
        const result = await analyzeCatchPhoto({
          photoUri: item.photoUri,
          tournamentId: item.tournamentId,
        });

        // Update queue item
        item.status = 'completed';
        item.result = result;
        item.completedAt = new Date().toISOString();
        processed++;

        console.log('[MeasurementQueue] Processed:', item.id);

      } catch (error) {
        console.error('[MeasurementQueue] Failed:', item.id, error);

        item.retryCount++;

        if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
          item.status = 'failed';
          item.error = error.message;
          failed++;
        } else {
          // Will retry next time
          console.log(`[MeasurementQueue] Will retry (${item.retryCount}/${MAX_RETRY_ATTEMPTS})`);
        }
      }
    }

    // Save updated queue
    await saveQueue(queue);

    // Clean up old completed items (older than 24 hours)
    await cleanupQueue();

    const stillPending = queue.filter(item => item.status === 'pending').length;

    return { processed, failed, pending: stillPending };

  } catch (error) {
    console.error('[MeasurementQueue] Queue processing error:', error);
    return { processed: 0, failed: 0, pending: 0 };
  }
}

/**
 * Get measurement result from queue by ID
 */
export async function getQueuedMeasurement(id) {
  try {
    const queue = await getQueue();
    return queue.find(item => item.id === id);
  } catch (error) {
    console.error('[MeasurementQueue] Failed to get queued measurement:', error);
    return null;
  }
}

/**
 * Remove a measurement from the queue
 */
export async function removeFromQueue(id) {
  try {
    const queue = await getQueue();
    const filteredQueue = queue.filter(item => item.id !== id);
    await saveQueue(filteredQueue);
    console.log('[MeasurementQueue] Removed:', id);
    return true;
  } catch (error) {
    console.error('[MeasurementQueue] Failed to remove from queue:', error);
    return false;
  }
}

/**
 * Get all pending measurements
 */
export async function getPendingMeasurements() {
  try {
    const queue = await getQueue();
    return queue.filter(item => item.status === 'pending');
  } catch (error) {
    console.error('[MeasurementQueue] Failed to get pending:', error);
    return [];
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const queue = await getQueue();
    return {
      total: queue.length,
      pending: queue.filter(item => item.status === 'pending').length,
      completed: queue.filter(item => item.status === 'completed').length,
      failed: queue.filter(item => item.status === 'failed').length,
    };
  } catch (error) {
    console.error('[MeasurementQueue] Failed to get stats:', error);
    return { total: 0, pending: 0, completed: 0, failed: 0 };
  }
}

/**
 * Clear all completed and failed items from queue
 */
export async function cleanupQueue() {
  try {
    const queue = await getQueue();
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    const cleanedQueue = queue.filter(item => {
      // Keep pending items
      if (item.status === 'pending') return true;

      // Remove old completed/failed items
      const createdTime = new Date(item.createdAt).getTime();
      return createdTime > cutoffTime;
    });

    if (cleanedQueue.length < queue.length) {
      await saveQueue(cleanedQueue);
      console.log(`[MeasurementQueue] Cleaned up ${queue.length - cleanedQueue.length} old items`);
    }

    return queue.length - cleanedQueue.length;
  } catch (error) {
    console.error('[MeasurementQueue] Cleanup failed:', error);
    return 0;
  }
}

/**
 * Start automatic queue processing on network reconnection
 */
export function startQueueProcessor() {
  // Listen for network state changes
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('[MeasurementQueue] Network connected - processing queue');
      processQueue();
    }
  });

  // Initial processing
  processQueue();

  return unsubscribe;
}

// ============================================================================
// Internal helpers
// ============================================================================

async function getQueue() {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('[MeasurementQueue] Failed to read queue:', error);
    return [];
  }
}

async function saveQueue(queue) {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[MeasurementQueue] Failed to save queue:', error);
    throw error;
  }
}
