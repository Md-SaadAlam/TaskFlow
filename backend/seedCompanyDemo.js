// Seeds a small, repeatable demo company for the account in DEMO_COMPANY_EMAIL.
// Run with `node seedCompanyDemo.js` from the backend folder.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');

const DEMO_COMPANY_EMAIL = 'ok@gmail.com';
const DEMO_COMPANY_NAME = 'OK Company';

function dateOffset(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function dayString(days) {
  return dateOffset(days).toISOString().slice(0, 10);
}

async function getOrCreateEmployee({ name, email }) {
  let user = await User.findOne({ email });
  if (user) {
    if (user.accountType !== 'employee') {
      throw new Error(`Demo address ${email} is already used by a company account.`);
    }
    return { user, password: null, created: false };
  }

  const password = `TFdemo-${crypto.randomBytes(9).toString('hex')}`;
  user = await User.create({ name, email, accountType: 'employee', password });
  return { user, password, created: true };
}

async function ensureActivity(activity) {
  const exists = await Activity.exists({ task: activity.task, action: activity.action, user: activity.user });
  if (!exists) await Activity.create(activity);
}

async function seedCompanyDemo() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from backend/.env.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

  const owner = await User.findOne({ email: DEMO_COMPANY_EMAIL });
  if (!owner) throw new Error(`${DEMO_COMPANY_EMAIL} does not have a TaskFlow account yet.`);

  owner.accountType = 'company';
  owner.companyName = DEMO_COMPANY_NAME;
  await owner.save();

  let workspace = await Workspace.findOne({ owner: owner._id }).sort({ createdAt: 1 });
  if (!workspace) {
    workspace = await Workspace.create({
      name: DEMO_COMPANY_NAME,
      description: 'Company team workspace',
      owner: owner._id,
      members: [{ user: owner._id, role: 'owner' }],
    });
  } else {
    workspace.name = DEMO_COMPANY_NAME;
    workspace.description = 'Company team workspace';
  }

  const employeeSpecs = [
    { name: 'Alex Morgan', email: 'alex.morgan.demo@example.com', role: 'admin' },
    { name: 'Sam Rivera', email: 'sam.rivera.demo@example.com', role: 'member' },
    { name: 'Taylor Chen', email: 'taylor.chen.demo@example.com', role: 'member' },
  ];
  const employees = [];
  for (const spec of employeeSpecs) {
    const employee = await getOrCreateEmployee(spec);
    if (!workspace.members.some((member) => member.user.toString() === employee.user._id.toString())) {
      workspace.members.push({ user: employee.user._id, role: spec.role });
    }
    employees.push({ ...employee, email: spec.email, name: spec.name });
  }
  await workspace.save();

  const projectSpecs = [
    {
      name: '[Demo] Brand & website',
      description: 'A sample redesign project for the OK Company team.',
      startDate: dayString(-4),
      dueDate: dayString(27),
    },
    {
      name: '[Demo] Product launch',
      description: 'A sample launch plan with work shared across the team.',
      startDate: dayString(0),
      dueDate: dayString(41),
    },
  ];
  const projects = [];
  for (const spec of projectSpecs) {
    let project = await Project.findOne({ workspace: workspace._id, name: spec.name });
    if (!project) {
      project = await Project.create({
        ...spec,
        workspace: workspace._id,
        createdBy: owner._id,
        startDate: new Date(`${spec.startDate}T00:00:00.000Z`),
        dueDate: new Date(`${spec.dueDate}T00:00:00.000Z`),
      });
    }
    projects.push(project);
  }

  const taskSpecs = [
    { project: 0, title: '[Demo] Shape the homepage structure', description: 'Outline the key sections and primary call to action.', status: 'In Progress', priority: 'High', assignee: 0, due: 5 },
    { project: 0, title: '[Demo] Draft the product story', description: 'Write a clear first pass for the homepage narrative.', status: 'In Review', priority: 'Medium', assignee: 1, due: 4 },
    { project: 0, title: '[Demo] Design mobile navigation', description: 'Keep the mobile menu simple and easy to scan.', status: 'To Do', priority: 'High', assignee: 2, due: 9 },
    { project: 0, title: '[Demo] Review brand direction', description: 'Collect feedback on the visual direction.', status: 'Done', priority: 'Low', assignee: 0, due: 0, completed: true },
    { project: 1, title: '[Demo] Prepare launch checklist', description: 'Gather the final steps for launch day.', status: 'To Do', priority: 'Urgent', assignee: 2, due: 13 },
    { project: 1, title: '[Demo] Draft launch email', description: 'Prepare the announcement email for review.', status: 'Done', priority: 'Medium', assignee: 1, due: 0, completed: true },
    { project: 1, title: '[Demo] Build signup flow', description: 'Connect the product signup screens.', status: 'In Progress', priority: 'High', assignee: 0, due: 19 },
    { project: 1, title: '[Demo] Schedule social posts', description: 'Prepare a small set of launch week posts.', status: 'To Do', priority: 'Low', assignee: 1, due: 25 },
  ];

  const tasks = [];
  for (const spec of taskSpecs) {
    let task = await Task.findOne({ workspace: workspace._id, title: spec.title });
    if (!task) {
      task = await Task.create({
        title: spec.title,
        description: spec.description,
        project: projects[spec.project]._id,
        workspace: workspace._id,
        status: spec.status,
        priority: spec.priority,
        assignee: employees[spec.assignee].user._id,
        createdBy: owner._id,
        dueDate: dateOffset(spec.due),
        completedAt: spec.completed ? new Date() : null,
      });
    }
    tasks.push(task);
    await ensureActivity({
      workspace: workspace._id,
      project: task.project,
      task: task._id,
      user: owner._id,
      action: 'task_created',
      message: `created task "${task.title}"`,
    });
    await ensureActivity({
      workspace: workspace._id,
      project: task.project,
      task: task._id,
      user: owner._id,
      action: 'task_assigned',
      message: `assigned "${task.title}" to ${employees[spec.assignee].name}`,
    });
    if (spec.completed) {
      await ensureActivity({
        workspace: workspace._id,
        project: task.project,
        task: task._id,
        user: owner._id,
        action: 'status_changed',
        message: `moved "${task.title}" from In Progress to Done`,
      });
    }
  }

  const comments = [
    { task: 0, employee: 0, text: 'I added the first outline. Please leave feedback on the section order.' },
    { task: 1, employee: 1, text: 'The draft is ready for review. I will tighten the headline after feedback.' },
  ];
  for (const item of comments) {
    const author = employees[item.employee].user;
    const exists = await Comment.exists({ task: tasks[item.task]._id, author: author._id, text: item.text });
    if (!exists) {
      await Comment.create({ task: tasks[item.task]._id, author: author._id, text: item.text });
      await ensureActivity({
        workspace: workspace._id,
        project: tasks[item.task].project,
        task: tasks[item.task]._id,
        user: author._id,
        action: 'comment_added',
        message: `commented on "${tasks[item.task].title}"`,
      });
    }
  }

  console.log(JSON.stringify({
    companyEmail: owner.email,
    companyName: owner.companyName,
    workspace: workspace.name,
    employeeCount: employees.length,
    projects: projects.map((project) => project.name),
    taskCount: tasks.length,
    newEmployeeLogins: employees.filter((employee) => employee.created).map((employee) => ({
      name: employee.name,
      email: employee.email,
      password: employee.password,
    })),
  }, null, 2));
}

seedCompanyDemo()
  .catch((error) => {
    console.error('Could not seed the company demo:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
