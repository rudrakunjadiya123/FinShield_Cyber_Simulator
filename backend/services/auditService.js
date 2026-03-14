const AuditLog = require('../models/AuditLog');

const logAudit = async (userId, action, resourceType, resourceId, details = '', organizationId = null) => {
  try {
    await AuditLog.create({
      user_id: userId,
      organization_id: organizationId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = { logAudit };
