const activityLogService = require('../services/activityLogService');

/**
 * Activity Logger Middleware
 * Non-blocking middleware that logs activities without affecting request flow
 * 
 * Usage:
 * router.post('/employees', authenticate('jwt'), activityLogger.log('CREATE_EMPLOYEE', 'Employee'), controller.createEmployee);
 */

/**
 * Create a logging middleware for a specific action
 * @param {String} action - Action name (e.g., 'CREATE_EMPLOYEE')
 * @param {String} entityType - Entity type (e.g., 'Employee')
 * @param {Function} getDescription - Optional function to generate description from req/res
 * @returns {Function} Express middleware
 */
const log = (action, entityType, getDescription = null) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    let responseData = null;
    let statusCode = null;

    // Intercept response to get status and data
    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson(data);
    };

    res.send = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalSend(data);
    };

    // Continue with request
    next();

    // Log after response is sent (non-blocking)
    setImmediate(async () => {
      try {
        const userInfo = activityLogService.extractUserInfo(req);
        
        // Skip logging if no user (unauthenticated requests)
        if (!userInfo || !userInfo.userId) {
          return;
        }

        // Determine entity ID from response or request
        let entityId = null;
        if (req.params.id) {
          entityId = req.params.id;
        } else if (responseData?.data?._id) {
          entityId = responseData.data._id;
        } else if (responseData?.data?.id) {
          entityId = responseData.data.id;
        }

        // Generate description
        let description = null;
        if (getDescription && typeof getDescription === 'function') {
          description = getDescription(req, res, responseData);
        } else {
          description = `${action.replace(/_/g, ' ')} - ${entityType}`;
        }

        // Determine status
        const status = (statusCode >= 200 && statusCode < 300) ? 'SUCCESS' : 'FAILED';
        const errorMessage = status === 'FAILED' && responseData?.error ? responseData.error : null;

        // Extract request info
        const ipAddress = activityLogService.extractIpAddress(req);
        const userAgent = activityLogService.extractUserAgent(req);

        // Log the activity (non-blocking, won't throw)
        await activityLogService.logActivity({
          userId: userInfo.userId,
          employeeId: userInfo.employeeId,
          companyId: userInfo.companyId,
          action,
          entityType,
          entityId,
          description,
          ipAddress,
          userAgent,
          status,
          errorMessage,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode
          }
        });

      } catch (error) {
        // Never let logging errors affect the application
        console.error('ActivityLogger middleware error (non-fatal):', error.message);
      }
    });
  };
};

/**
 * Simple logging middleware that logs any authenticated request
 * Useful for general activity tracking
 */
const logRequest = (req, res, next) => {
  // Only log authenticated requests
  if (!req.user || !req.user._id) {
    return next();
  }

  // Log in background (non-blocking)
  setImmediate(async () => {
    try {
      const userInfo = activityLogService.extractUserInfo(req);
      if (!userInfo) return;

      const ipAddress = activityLogService.extractIpAddress(req);
      const userAgent = activityLogService.extractUserAgent(req);

      // Determine action from HTTP method
      let action = 'UNKNOWN';
      if (req.method === 'POST') action = 'CREATE';
      else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
      else if (req.method === 'DELETE') action = 'DELETE';

      await activityLogService.logActivity({
        userId: userInfo.userId,
        employeeId: userInfo.employeeId,
        companyId: userInfo.companyId,
        action: `${action}_${req.path.split('/').pop().toUpperCase()}`,
        entityType: 'Other',
        description: `${req.method} ${req.path}`,
        ipAddress,
        userAgent,
        status: res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED',
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode
        }
      });
    } catch (error) {
      console.error('ActivityLogger logRequest error (non-fatal):', error.message);
    }
  });

  next();
};

module.exports = {
  log,
  logRequest
};

