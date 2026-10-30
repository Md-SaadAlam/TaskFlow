const express = require('express');
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();
router.use(protect);
router.param('taskId', validateObjectId);
router.param('commentId', validateObjectId);

router.route('/').get(taskController.listTasks).post(taskController.createTask);
router
  .route('/:taskId')
  .get(taskController.getTask)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);
router.patch('/:taskId/status', taskController.updateTaskStatus);

router
  .route('/:taskId/comments')
  .get(commentController.getComments)
  .post(commentController.addComment);
router.delete('/:taskId/comments/:commentId', commentController.deleteComment);

module.exports = router;
