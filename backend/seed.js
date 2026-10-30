// OPTIONAL demo data. Run with:  npm run seed
// Remove it again with:          npm run seed:remove
// It creates two demo users, one workspace, two projects and some tasks so you can see the dashboard and board filled.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');
const { startOfTodayUTC, addDays } = require('./utils/dates');

const DEMO_PASSWORD = 'Demo@1234';
const DEMO_EMAILS = ['demo@taskflow.dev', 'teammate@taskflow.dev'];

async function removeDemoData() {
  const users = await User.find({ email: { $in: DEMO_EMAILS } });
  const userIds = users.map((u) => u._id);
  const workspaces = await Workspace.find({ owner: { $in: userIds } });
  const workspaceIds = workspaces.map((w) => w._id);
  const taskIds = await Task.distinct('_id', { workspace: { $in: workspaceIds } });

  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ workspace: { $in: workspaceIds } });
  await Activity.deleteMany({ workspace: { $in: workspaceIds } });
  await Project.deleteMany({ workspace: { $in: workspaceIds } });
  await Workspace.deleteMany({ _id: { $in: workspaceIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  console.log('Demo data removed (demo users and the workspaces they own).');
}

async function createDemoData() {
  if (await User.findOne({ email: DEMO_EMAILS[0] })) {
    console.log('Demo data already exists. Run "npm run seed:remove" first if you want to recreate it.');
    return;
  }

  const demo = await User.create({ name: 'Demo User', email: DEMO_EMAILS[0], password: DEMO_PASSWORD });
  const mate = await User.create({ name: 'Sam Teammate', email: DEMO_EMAILS[1], password: DEMO_PASSWORD });

  const workspace = await Workspace.create({
    name: 'Demo Workspace',
    description: 'Sample workspace created by the seed script.',
    owner: demo._id,
    members: [{ user: demo._id, role: 'owner' }, { user: mate._id, role: 'member' }],
  });

  const today = startOfTodayUTC();
  const website = await Project.create({
    name: 'Website Redesign',
    description: 'Refresh the marketing website before the product launch.',
    workspace: workspace._id,
    createdBy: demo._id,
    startDate: addDays(today, -14),
    dueDate: addDays(today, 21),
  });
  const mobile = await Project.create({
    name: 'Mobile App Launch',
    description: 'Prepare store listings, testing and release notes.',
    workspace: workspace._id,
    createdBy: mate._id,
    startDate: addDays(today, -7),
    dueDate: addDays(today, 45),
  });

  const sample = [
    [website, 'Collect brand assets', 'Done', 'Low', -10, demo],
    [website, 'Design homepage mockup', 'Done', 'High', -4, mate],
    [website, 'Build responsive navbar', 'In Review', 'Medium', 2, demo],
    [website, 'Write landing page copy', 'In Progress', 'High', 4, mate],
    [website, 'Set up contact form', 'To Do', 'Medium', 9, null],
    [website, 'Fix broken pricing links', 'To Do', 'Urgent', -2, demo],
    [mobile, 'Create app store screenshots', 'To Do', 'Medium', 12, mate],
    [mobile, 'Run beta testing round', 'In Progress', 'High', 7, demo],
    [mobile, 'Draft release notes', 'To Do', 'Low', 20, null],
  ];

  for (const [project, title, status, priority, dueOffset, assignee] of sample) {
    const task = await Task.create({
      title,
      description: `Sample task: ${title}.`,
      project: project._id,
      workspace: workspace._id,
      status,
      priority,
      dueDate: addDays(today, dueOffset),
      assignee: assignee ? assignee._id : null,
      createdBy: demo._id,
    });
    await Activity.create({
      workspace: workspace._id,
      project: project._id,
      task: task._id,
      user: demo._id,
      action: 'task_created',
      message: `created task "${title}"`,
    });
    if (title === 'Write landing page copy') {
      await Comment.create({ task: task._id, author: mate._id, text: 'First draft is ready for feedback.' });
    }
  }

  console.log('Demo data created.');
  console.log(`Log in with ${DEMO_EMAILS[0]} (or ${DEMO_EMAILS[1]}) and password ${DEMO_PASSWORD}`);
}

async function run() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run the seed script when NODE_ENV=production.');
    process.exit(1);
  }
  try {
    await connectDB();
    if (process.argv.includes('--remove')) await removeDemoData();
    else await createDemoData();
  } catch (error) {
    console.error('Seed script failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
