const Activity = require('../models/Activity');
const Project = require('../models/Project');

// Saves one activity line. A logging failure must never break the real action, so errors are only logged.
async function logActivity({ workspace, project, task = null, user, action, message }) {
  try {
    await Activity.create({ workspace, project, task, user, action, message });
  } catch (error) {
    console.error('Could not save activity:', error.message);
  }
}

// Bumps the project's "updatedAt" so "recently updated projects" reflects task changes.
async function touchProject(projectId) {
  try {
    await Project.updateOne({ _id: projectId }, { $set: { updatedAt: new Date() } });
  } catch (error) {
    console.error('Could not update project timestamp:', error.message);
  }
}

module.exports = { logActivity, touchProject };
