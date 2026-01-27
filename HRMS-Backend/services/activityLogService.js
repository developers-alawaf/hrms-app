const ActivityLog = require('../models/activityLog');

/**
 * Activity Log Service - Fail-safe logging that never breaks the application
 * All functions are async and non-blocking with comprehensive error handling
 */

/**
 * Main logging function - All other functions use this internally
 * @param {Object} logData - Log data object
 * @returns {Promise<void>} - Never throws, always resolves
 */
const logActivity = async (logData) => {
  try {
    // Validate required fields
    if (!logData.userId || !logData.action || !logData.entityType || !logData.description) {
      console.warn('ActivityLog: Missing required fields, skipping log:', {
        hasUserId: !!logData.userId,
        hasAction: !!logData.action,
        hasEntityType: !!logData.entityType,
        hasDescription: !!logData.description
      });
      return;
    }

    // Create log entry (non-blocking - don't await in calling code)
    const activityLog = new ActivityLog({
      userId: logData.userId,
      employeeId: logData.employeeId || null,
      companyId: logData.companyId || null,
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId || null,
      description: logData.description,
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      changes: logData.changes || null,
      metadata: logData.metadata || null,
      status: logData.status || 'SUCCESS',
      errorMessage: logData.errorMessage || null,
      timestamp: logData.timestamp || new Date()
    });

    // Save without blocking - fire and forget
    activityLog.save().catch(err => {
      // Only log to console, never throw
      console.error('ActivityLog: Failed to save log (non-fatal):', err.message);
    });

  } catch (error) {
    // Catch any unexpected errors - never throw
    console.error('ActivityLog: Unexpected error in logActivity (non-fatal):', error.message);
  }
};

/**
 * Log a CREATE action
 */
const logCreate = async (userId, entityType, entityId, description, options = {}) => {
  await logActivity({
    userId,
    employeeId: options.employeeId,
    companyId: options.companyId,
    action: `CREATE_${entityType.toUpperCase()}`,
    entityType,
    entityId,
    description: description || `Created ${entityType}`,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    metadata: options.metadata,
    status: 'SUCCESS'
  });
};

/**
 * Log an UPDATE action with before/after changes
 */
const logUpdate = async (userId, entityType, entityId, description, oldData, newData, options = {}) => {
  // Sanitize sensitive data from changes
  const sanitizedOldData = sanitizeSensitiveData(oldData);
  const sanitizedNewData = sanitizeSensitiveData(newData);

  await logActivity({
    userId,
    employeeId: options.employeeId,
    companyId: options.companyId,
    action: `UPDATE_${entityType.toUpperCase()}`,
    entityType,
    entityId,
    description: description || `Updated ${entityType}`,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    changes: {
      before: sanitizedOldData,
      after: sanitizedNewData
    },
    metadata: options.metadata,
    status: 'SUCCESS'
  });
};

/**
 * Log a DELETE action
 */
const logDelete = async (userId, entityType, entityId, description, options = {}) => {
  await logActivity({
    userId,
    employeeId: options.employeeId,
    companyId: options.companyId,
    action: `DELETE_${entityType.toUpperCase()}`,
    entityType,
    entityId,
    description: description || `Deleted ${entityType}`,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    metadata: options.metadata,
    status: 'SUCCESS'
  });
};

/**
 * Log login action
 */
const logLogin = async (userId, ipAddress, userAgent, status = 'SUCCESS', errorMessage = null) => {
  await logActivity({
    userId,
    action: 'LOGIN',
    entityType: 'User',
    entityId: userId,
    description: status === 'SUCCESS' ? 'User logged in' : 'Login failed',
    ipAddress,
    userAgent,
    status,
    errorMessage
  });
};

/**
 * Log logout action
 */
const logLogout = async (userId, ipAddress, userAgent) => {
  await logActivity({
    userId,
    action: 'LOGOUT',
    entityType: 'User',
    entityId: userId,
    description: 'User logged out',
    ipAddress,
    userAgent,
    status: 'SUCCESS'
  });
};

/**
 * Log password change
 */
const logPasswordChange = async (userId, ipAddress, userAgent, status = 'SUCCESS', errorMessage = null) => {
  await logActivity({
    userId,
    action: 'CHANGE_PASSWORD',
    entityType: 'User',
    entityId: userId,
    description: status === 'SUCCESS' ? 'Password changed' : 'Password change failed',
    ipAddress,
    userAgent,
    status,
    errorMessage
  });
};

/**
 * Log a failed action
 */
const logError = async (userId, action, entityType, description, errorMessage, options = {}) => {
  await logActivity({
    userId,
    employeeId: options.employeeId,
    companyId: options.companyId,
    action,
    entityType,
    entityId: options.entityId,
    description,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    status: 'FAILED',
    errorMessage: errorMessage || 'Unknown error'
  });
};

/**
 * Sanitize sensitive data from log entries
 * Removes passwords, tokens, and other sensitive information
 */
const sanitizeSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Extract user info from request object safely
 */
const extractUserInfo = (req) => {
  try {
    if (!req || !req.user) {
      return null;
    }

    return {
      userId: req.user._id || req.user.id,
      employeeId: req.user.employeeId,
      companyId: req.user.companyId
    };
  } catch (error) {
    console.error('ActivityLog: Error extracting user info:', error.message);
    return null;
  }
};

/**
 * Extract IP address from request
 */
const extractIpAddress = (req) => {
  try {
    return req?.ip || 
           req?.connection?.remoteAddress || 
           req?.socket?.remoteAddress ||
           req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           req?.headers?.['x-real-ip'] ||
           'Unknown';
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Extract user agent from request
 */
const extractUserAgent = (req) => {
  try {
    return req?.headers?.['user-agent'] || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
};

module.exports = {
  logActivity,
  logCreate,
  logUpdate,
  logDelete,
  logLogin,
  logLogout,
  logPasswordChange,
  logError,
  sanitizeSensitiveData,
  extractUserInfo,
  extractIpAddress,
  extractUserAgent
};

