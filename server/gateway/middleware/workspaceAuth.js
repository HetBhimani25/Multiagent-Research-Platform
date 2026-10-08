const { ResearchWorkspace, WorkspaceMember, ResearchDocument } = require('../db');
const { hasPermission } = require('./permissions');

/**
 * Middleware factory to enforce workspace-level permissions.
 * Looks up workspace by `workspaceId` or `documentId` parameter.
 * Validates that current user is an active member with the required permission.
 */
function requireWorkspacePermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Authentication required.' });
      }

      let workspaceId = req.params?.workspaceId || req.body?.workspaceId || req.query?.workspaceId;
      const documentId = req.params?.documentId || req.body?.documentId || req.query?.documentId;

      // If workspaceId is not direct, resolve from documentId
      if (!workspaceId && documentId) {
        const workspace = await ResearchWorkspace.findOne({
          where: { documentId, status: 'ACTIVE' },
        });
        if (workspace) {
          workspaceId = workspace.id;
        } else {
          // Check if document exists and user is owner
          const doc = await ResearchDocument.findByPk(documentId);
          if (!doc) {
            return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' });
          }
          if (doc.ownerId === req.user.id) {
            // Auto-create workspace if it was missing for this document
            const newWorkspace = await ResearchWorkspace.create({
              name: `Workspace: ${doc.topic}`,
              ownerId: req.user.id,
              documentId: doc.id,
              status: 'ACTIVE',
              visibility: 'PRIVATE',
            });
            await WorkspaceMember.create({
              workspaceId: newWorkspace.id,
              userId: req.user.id,
              role: 'OWNER',
              status: 'ACTIVE',
              joinedAt: new Date(),
            });
            workspaceId = newWorkspace.id;
          }
        }
      }

      if (!workspaceId) {
        return res.status(400).json({ error: 'WORKSPACE_ID_REQUIRED', message: 'Workspace ID or Document ID required.' });
      }

      const workspace = await ResearchWorkspace.findByPk(workspaceId, {
        include: [{ model: ResearchDocument, as: 'document' }],
      });

      if (!workspace || workspace.status === 'DELETED') {
        return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found.' });
      }

      // Check if user is the workspace owner
      let role = null;
      let member = null;

      if (workspace.ownerId === req.user.id) {
        role = 'OWNER';
      } else {
        member = await WorkspaceMember.findOne({
          where: {
            workspaceId: workspace.id,
            userId: req.user.id,
            status: 'ACTIVE',
          },
        });

        if (!member) {
          return res.status(403).json({
            error: 'WORKSPACE_ACCESS_DENIED',
            message: 'You are not a member of this research workspace.',
          });
        }
        role = member.role;
      }

      // Verify permission
      if (requiredPermission && !hasPermission(role, requiredPermission)) {
        return res.status(403).json({
          error: 'PERMISSION_DENIED',
          message: `Your role (${role}) does not have permission for ${requiredPermission}.`,
          role,
          required: requiredPermission,
        });
      }

      req.workspace = workspace;
      req.workspaceMember = member;
      req.workspaceRole = role;
      next();
    } catch (err) {
      console.error('Workspace authorization error:', err);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
  };
}

module.exports = {
  requireWorkspacePermission,
};
