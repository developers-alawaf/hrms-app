const ActivityLog = require('../models/activityLog');
const { authenticate } = require('../middleware/auth');
const { restrictTo } = require('../middleware/auth');
const mongoose = require('mongoose');

/**
 * Get activity logs with filtering, pagination, and search
 * Access: Super Admin, HR Manager, Company Admin can see all logs
 * Others can only see their own logs
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      employeeId,
      companyId,
      action,
      entityType,
      entityId,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    const query = {};

    // Role-based access control
    const userRole = req.user.role;
    const isAuthorized = ['Super Admin', 'HR Manager', 'Company Admin'].includes(userRole);

    if (!isAuthorized) {
      // Regular users can only see their own logs
      query.userId = req.user._id;
    } else {
      // Authorized users can filter by userId
      if (userId) {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          query.userId = new mongoose.Types.ObjectId(userId);
        }
      }

      // Filter by company (authorized users only)
      if (companyId) {
        if (mongoose.Types.ObjectId.isValid(companyId)) {
          query.companyId = new mongoose.Types.ObjectId(companyId);
        }
      }
    }

    // Filter by employee
    if (employeeId) {
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query.employeeId = new mongoose.Types.ObjectId(employeeId);
      }
    }

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by entity type
    if (entityType) {
      query.entityType = entityType;
    }

    // Filter by entity ID
    if (entityId) {
      if (mongoose.Types.ObjectId.isValid(entityId)) {
        query.entityId = new mongoose.Types.ObjectId(entityId);
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include entire end date
        query.timestamp.$lte = end;
      }
    }

    // Search in description
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query with population
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('userId', 'email role')
        .populate('employeeId', 'fullName newEmployeeCode')
        .populate('companyId', 'name abbreviation')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('getActivityLogs - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get a specific activity log by ID
 */
exports.getActivityLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await ActivityLog.findById(id)
      .populate('userId', 'email role')
      .populate('employeeId', 'fullName newEmployeeCode')
      .populate('companyId', 'name abbreviation')
      .lean();

    if (!log) {
      return res.status(404).json({ success: false, error: 'Activity log not found' });
    }

    // Check access - users can only see their own logs unless authorized
    const isAuthorized = ['Super Admin', 'HR Manager', 'Company Admin'].includes(req.user.role);
    if (!isAuthorized && log.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.status(200).json({ success: true, data: log });

  } catch (error) {
    console.error('getActivityLogById - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get activity logs for a specific user
 */
exports.getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check access
    const isAuthorized = ['Super Admin', 'HR Manager', 'Company Admin'].includes(req.user.role);
    if (!isAuthorized && userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: new mongoose.Types.ObjectId(userId) })
        .populate('userId', 'email role')
        .populate('employeeId', 'fullName newEmployeeCode')
        .populate('companyId', 'name abbreviation')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments({ userId: new mongoose.Types.ObjectId(userId) })
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('getUserActivityLogs - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get activity logs for a specific entity
 */
exports.getEntityActivityLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ success: false, error: 'Invalid entity ID' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find({
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId)
      })
        .populate('userId', 'email role')
        .populate('employeeId', 'fullName newEmployeeCode')
        .populate('companyId', 'name abbreviation')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments({
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId)
      })
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('getEntityActivityLogs - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get activity statistics
 */
exports.getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate, companyId } = req.query;

    const matchQuery = {};

    // Date range
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.timestamp.$lte = end;
      }
    }

    // Company filter (if authorized)
    const isAuthorized = ['Super Admin', 'HR Manager', 'Company Admin'].includes(req.user.role);
    if (companyId && isAuthorized) {
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        matchQuery.companyId = new mongoose.Types.ObjectId(companyId);
      }
    } else if (!isAuthorized) {
      // Regular users only see their company's stats
      if (req.user.companyId) {
        matchQuery.companyId = req.user.companyId;
      }
    }

    const stats = await ActivityLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ success: true, data: stats });

  } catch (error) {
    console.error('getActivityStats - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

