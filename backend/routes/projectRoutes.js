const express = require('express');
const controller = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();
router.use(protect);
router.param('projectId', validateObjectId);

router.route('/').get(controller.listProjects).post(controller.createProject);
router
  .route('/:projectId')
  .get(controller.getProject)
  .put(controller.updateProject)
  .delete(controller.deleteProject);

module.exports = router;
