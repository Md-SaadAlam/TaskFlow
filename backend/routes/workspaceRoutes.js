const express = require('express');
const controller = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const { getWorkspaceTaskReport } = require('../controllers/dashboardController');

const router = express.Router();
router.use(protect);
router.param('workspaceId', validateObjectId);
router.param('userId', validateObjectId);
router.get('/:workspaceId/analytics/task-report', getWorkspaceTaskReport);

router.route('/').get(controller.listWorkspaces).post(controller.createWorkspace);
router
  .route('/:workspaceId')
  .get(controller.getWorkspace)
  .put(controller.updateWorkspace)
  .delete(controller.deleteWorkspace);

router.post('/:workspaceId/members', controller.addMember);
router.patch('/:workspaceId/members/:userId', controller.updateMemberRole);
router.delete('/:workspaceId/members/:userId', controller.removeMember);

module.exports = router;
