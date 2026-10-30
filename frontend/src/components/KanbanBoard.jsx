import { useState } from 'react';
import TaskCard from './TaskCard';
import { STATUS_STYLES, TASK_STATUSES } from '../utils/constants';

// Four columns built with the browser's native drag-and-drop (no library).
// onMoveTask(task, newStatus) is called when a card is dropped or its dropdown is changed.
export default function KanbanBoard({ tasks, onMoveTask }) {
  const [dragOverStatus, setDragOverStatus] = useState(null);

  function handleDrop(event, status) {
    event.preventDefault();
    setDragOverStatus(null);
    const taskId = event.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== status) onMoveTask(task, status);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            onDragOver={(event) => {
              event.preventDefault(); // required, otherwise the browser will not allow dropping here
              setDragOverStatus(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDragOverStatus(null);
            }}
            onDrop={(event) => handleDrop(event, status)}
            className={`glass-sm flex min-h-[12rem] flex-col rounded-xl border border-t-4 border-slate-200 bg-slate-100/70 p-3 ${STATUS_STYLES[status].top} ${
              dragOverStatus === status ? 'ring-2 ring-brand-500' : ''
            }`}
          >
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{status}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{columnTasks.length}</span>
            </header>
            <div className="space-y-2">
              {columnTasks.map((task) => (
                <TaskCard key={task._id} task={task} onStatusChange={onMoveTask} />
              ))}
            </div>
            {columnTasks.length === 0 && <p className="py-6 text-center text-xs text-slate-400">No tasks here. Drop one in.</p>}
          </section>
        );
      })}
    </div>
  );
}
