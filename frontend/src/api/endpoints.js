// All backend calls live here, so pages never contain URLs.
import client from './client';

const send = (request) => request.then((response) => response.data);

export const authApi = {
  register: (body) => send(client.post('/auth/register', body)),
  login: (body) => send(client.post('/auth/login', body)),
  me: () => send(client.get('/auth/me')),
};

export const userApi = {
  updateProfile: (body) => send(client.put('/users/profile', body)),
  changePassword: (body) => send(client.put('/users/password', body)),
};

export const workspaceApi = {
  list: () => send(client.get('/workspaces')),
  create: (body) => send(client.post('/workspaces', body)),
  get: (id) => send(client.get(`/workspaces/${id}`)),
  update: (id, body) => send(client.put(`/workspaces/${id}`, body)),
  remove: (id) => send(client.delete(`/workspaces/${id}`)),
  addMember: (id, body) => send(client.post(`/workspaces/${id}/members`, body)),
  updateMemberRole: (id, userId, role) => send(client.patch(`/workspaces/${id}/members/${userId}`, { role })),
  removeMember: (id, userId) => send(client.delete(`/workspaces/${id}/members/${userId}`)),
  taskReport: (id) => send(client.get(`/workspaces/${id}/analytics/task-report`)),
};

export const projectApi = {
  list: (params) => send(client.get('/projects', { params })),
  create: (body) => send(client.post('/projects', body)),
  get: (id) => send(client.get(`/projects/${id}`)),
  update: (id, body) => send(client.put(`/projects/${id}`, body)),
  remove: (id) => send(client.delete(`/projects/${id}`)),
};

export const taskApi = {
  list: (params) => send(client.get('/tasks', { params })),
  create: (body) => send(client.post('/tasks', body)),
  get: (id) => send(client.get(`/tasks/${id}`)),
  update: (id, body) => send(client.put(`/tasks/${id}`, body)),
  updateStatus: (id, status) => send(client.patch(`/tasks/${id}/status`, { status })),
  remove: (id) => send(client.delete(`/tasks/${id}`)),
  comments: (id) => send(client.get(`/tasks/${id}/comments`)),
  addComment: (id, text) => send(client.post(`/tasks/${id}/comments`, { text })),
  deleteComment: (id, commentId) => send(client.delete(`/tasks/${id}/comments/${commentId}`)),
};

export const activityApi = {
  list: (params) => send(client.get('/activity', { params })),
};

export const dashboardApi = {
  get: () => send(client.get('/dashboard')),
};
