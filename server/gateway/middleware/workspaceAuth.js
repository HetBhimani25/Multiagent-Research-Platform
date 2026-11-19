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

      let workspace = null;

      // 1. Try to find workspace by workspaceId directly
      if (workspaceId) {
        workspace = await ResearchWorkspace.findByPk(workspaceId, {
          include: [{ model: ResearchDocument, as: 'document' }],
        });

        // If not found by primary key, check if workspaceId was actually a documentId!
        if (!workspace) {
          workspace = await ResearchWorkspace.findOne({
            where: { documentId: workspaceId, status: 'ACTIVE' },
            include: [{ model: ResearchDocument, as: 'document' }],
          });
        }
      }

      // 2. If not found yet and we have a documentId parameter, find by documentId
      if (!workspace && documentId) {
        workspace = await ResearchWorkspace.findOne({
          where: { documentId, status: 'ACTIVE' },
          include: [{ model: ResearchDocument, as: 'document' }],
        });
      }

      // 3. If workspace does not exist at all, check if document exists and auto-create workspace for owner
      const effectiveDocId = documentId || workspaceId;
      if (!workspace && effectiveDocId) {
        const doc = await ResearchDocument.findByPk(effectiveDocId);
        if (doc) {
          if (doc.ownerId === req.user.id) {
            // Auto-create workspace if it was missing for this document
            workspace = await ResearchWorkspace.create({
              name: `Workspace: ${doc.topic}`,
              description: `Collaborative research environment for "${doc.topic}"`,
              ownerId: req.user.id,
              documentId: doc.id,
              status: 'ACTIVE',
              visibility: 'PRIVATE',
            });
            await WorkspaceMember.create({
              workspaceId: workspace.id,
              userId: req.user.id,
              role: 'OWNER',
              status: 'ACTIVE',
              joinedAt: new Date(),
            });
            workspace.document = doc;
            workspaceId = workspace.id;
          }
        }
      }

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
