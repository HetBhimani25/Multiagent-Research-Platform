const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireWorkspacePermission } = require('../middleware/workspaceAuth');
const { PERMISSIONS } = require('../middleware/permissions');
const {
  AgentRun,
  User,
  ActivityLog,
} = require('../db');

const router = express.Router();

// 1. Get AI Agent Runs for a Document
router.get('/documents/:documentId/agent-runs', verifyToken, requireWorkspacePermission(PERMISSIONS.DOCUMENT_VIEW), async (req, res) => {
  try {
    const { documentId } = req.params;

    const runs = await AgentRun.findAll({
      where: { documentId },
      include: [{ model: User, as: 'initiator', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    // Check if an AI run is currently active
    const activeRun = runs.find((r) => r.status === 'RUNNING' || r.status === 'QUEUED');

    return res.json({
      success: true,
      data: {
        runs,
        hasActiveRun: !!activeRun,
        activeRun: activeRun || null,
      },
    });
  } catch (err) {
    console.error('Get agent runs error:', err);
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// 2. Start / Record an AI Agent Run (requires AI_RUN permission)
router.post('/documents/:documentId/agent-runs', verifyToken, requireWorkspacePermission(PERMISSIONS.AI_RUN), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { runType = 'FULL_RESEARCH', agentName = '10-Agent LangGraph Pipeline', input } = req.body;

    // Prevent duplicate concurrent runs on the same document
    const existingActive = await AgentRun.findOne({
      where: {
        documentId,
        status: 'RUNNING',
      },
    });

    if (existingActive) {
      return res.status(409).json({
        error: 'AI_RUN_ALREADY_ACTIVE',
        message: 'A research execution is currently in progress on this document.',
        activeRun: existingActive,
      });
    }

    const run = await AgentRun.create({
      workspaceId: req.workspace.id,
      documentId,
      initiatedBy: req.user.id,
      runType,
      agentName,
      status: 'RUNNING',
      input: input || {},
      startedAt: new Date(),
    });

    await ActivityLog.create({
      workspaceId: req.workspace.id,
      documentId,
      userId: req.user.id,
      action: 'AI_RUN_STARTED',
      entityType: 'agent_run',
      entityId: run.id,
      metadata: { runType, agentName },
    });

    const fullRun = await AgentRun.findByPk(run.id, {
      include: [{ model: User, as: 'initiator', attributes: ['id', 'fullName', 'email'] }],
    });

    return res.status(201).json({ success: true, data: fullRun });
  } catch (err) {
    console.error('Start agent run error:', err);
    return res.status(500).json({ error: 'START_FAILED', message: err.message });
  }
});

// 3. Complete or Fail an AI Agent Run
router.patch('/agent-runs/:runId', verifyToken, async (req, res) => {
  try {
    const { runId } = req.params;
    const { status, output, error } = req.body;

    const run = await AgentRun.findByPk(runId);
    if (!run) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Agent run not found.' });
    }

    if (status) run.status = status;
    if (output) run.output = output;
    if (error) run.error = error;
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      run.completedAt = new Date();
    }

    await run.save();

    await ActivityLog.create({
      workspaceId: run.workspaceId,
      documentId: run.documentId,
      userId: req.user.id,
      action: status === 'COMPLETED' ? 'AI_RUN_COMPLETED' : 'AI_RUN_FAILED',
      entityType: 'agent_run',
      entityId: run.id,
      metadata: { status, error },
    });

    return res.json({ success: true, data: run });
  } catch (err) {
    console.error('Update agent run error:', err);
    return res.status(500).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

module.exports = router;
