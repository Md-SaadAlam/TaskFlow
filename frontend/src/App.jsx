import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { GuestRoute, ProtectedRoute } from './components/RouteGuards';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import WorkspaceDetail from './pages/WorkspaceDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectBoard from './pages/ProjectBoard';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Only for logged-out visitors */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Only for logged-in users, shown inside the sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/board" element={<ProjectBoard />} />
          <Route path="/tasks/:taskId" element={<TaskDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
