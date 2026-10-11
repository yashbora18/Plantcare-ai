import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Droplets,
  Scissors,
  Sprout,
  X,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/calendar.css';

const TABS = [
  { id: 'today', label: 'Due Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All Tasks' },
];

export default function CareCalendarPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPlants, setUserPlants] = useState([]);

  // Modals
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    plant_id: '',
    task_type: 'watering',
    due_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks({ filter_by: activeTab });
      setTasks(data);
    } catch (err) {
      addToast(err.message || 'Could not load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  useEffect(() => {
    async function loadPlants() {
      try {
        const plants = await api.getPlants();
        setUserPlants(plants);
      } catch (err) {
        console.error('Could not load plants for task dropdown', err);
      }
    }
    loadPlants();
  }, []);

  const handleOpenCompleteModal = (task) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedTask) return;
    try {
      await api.completeTask(selectedTask.id, { notes: completionNotes });
      addToast(`Completed "${selectedTask.title}"! Next cycle scheduled.`, 'success');
      setCompleteModalOpen(false);
      loadTasks();
    } catch (err) {
      addToast(err.message || 'Failed to complete task', 'error');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      addToast('Please enter a task title', 'warning');
      return;
    }

    try {
      await api.createTask({
        title: formData.title,
        plant_id: formData.plant_id ? parseInt(formData.plant_id, 10) : null,
        task_type: formData.task_type,
        due_date: new Date(formData.due_date).toISOString(),
        description: formData.description,
      });
      addToast('Task created successfully!', 'success');
      setNewTaskModalOpen(false);
      setFormData({
        title: '',
        plant_id: '',
        task_type: 'watering',
        due_date: new Date().toISOString().split('T')[0],
        description: '',
      });
      loadTasks();
    } catch (err) {
      addToast(err.message || 'Failed to create task', 'error');
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'watering': return <Droplets size={16} color="var(--status-info)" />;
      case 'pruning': return <Scissors size={16} color="var(--color-earth-brown)" />;
      case 'repotting': return <Sprout size={16} color="var(--accent-fresh)" />;
      default: return <Clock size={16} color="var(--text-muted)" />;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Care Calendar & Task Manager</span>
            <CalendarDays size={28} color="var(--accent-fresh)" />
          </h1>
          <p className="page-subtitle">
            Synchronized watering and health checks. Completing tasks advances recurring plant schedules.
          </p>
        </div>

        <button onClick={() => setNewTaskModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Schedule Care Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="calendar-filter-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`calendar-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '76px' }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckCircle2 size={36} />
          </div>
          <h3>No Tasks in this Filter</h3>
          <p>
            {activeTab === 'today'
              ? 'No care tasks are due today. All your plants are happy!'
              : activeTab === 'overdue'
              ? 'Great job! You have zero overdue tasks.'
              : 'No scheduled tasks found.'}
          </p>
          <button onClick={() => setNewTaskModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
            Schedule a Custom Task
          </button>
        </div>
      ) : (
        <div className="task-calendar-list">
          {tasks.map((task) => {
            const dueDate = new Date(task.due_date);
            const isToday = dueDate.toDateString() === new Date().toDateString();
            const isOverdue = !task.is_completed && dueDate < new Date() && !isToday;

            return (
              <div
                key={task.id}
                className={`calendar-task-card ${
                  task.is_completed ? 'completed' : isOverdue ? 'overdue' : isToday ? 'today' : ''
                }`}
              >
                <div className="task-info-col">
                  {/* Complete check button */}
                  <button
                    onClick={() => !task.is_completed && handleOpenCompleteModal(task)}
                    className={`task-check-circle ${task.is_completed ? 'completed' : ''}`}
                    title={task.is_completed ? 'Completed' : 'Click to mark complete'}
                    aria-label="Toggle task completion"
                    disabled={task.is_completed}
                  >
                    {task.is_completed && <CheckCircle2 size={12} />}
                  </button>

                  {task.plant_image_url ? (
                    <img src={task.plant_image_url} alt="" className="task-thumb" />
                  ) : (
                    <div className="task-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getTaskIcon(task.task_type)}
                    </div>
                  )}

                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {task.title}
                    </strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{task.plant_name ? `Plant: ${task.plant_name}` : 'General Garden'}</span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize' }}>{task.task_type}</span>
                      {task.notes && (
                        <>
                          <span>•</span>
                          <span style={{ fontStyle: 'italic' }}>{task.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="task-due-badge">
                    <Clock size={14} />
                    <span>
                      {task.is_completed
                        ? `Done on ${new Date(task.completed_at).toLocaleDateString()}`
                        : dueDate.toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`badge ${
                      task.is_completed
                        ? 'badge-healthy'
                        : isOverdue
                        ? 'badge-danger'
                        : 'badge-leaf'
                    }`}
                  >
                    {task.is_completed ? 'Completed' : isOverdue ? 'Overdue' : 'Scheduled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Task Confirmation Modal */}
      {completeModalOpen && selectedTask && (
        <div className="modal-overlay" onClick={() => setCompleteModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <CheckCircle2 size={22} color="var(--status-healthy)" />
                <span>Complete Task: {selectedTask.title}</span>
              </h3>
              <button onClick={() => setCompleteModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                Marking this care task complete will automatically advance its recurring schedule in your calendar.
              </p>

              <div className="form-group">
                <label className="form-label">Field Notes (Optional)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Added diluted liquid seaweed fertilizer, checked leaf underside"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setCompleteModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleConfirmComplete} className="btn btn-primary">
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {newTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setNewTaskModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <CalendarDays size={22} color="var(--accent-fresh)" />
                <span>Schedule Care Task</span>
              </h3>
              <button onClick={() => setNewTaskModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Bottom water Monstera, Prune yellow Basil leaves"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Associated Plant</label>
                  <select
                    className="select-control"
                    value={formData.plant_id}
                    onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                  >
                    <option value="">-- General Garden Task (No specific plant) --</option>
                    {userPlants.map((p) => (
                      <option key={p.id} value={p.id}>{p.common_name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Task Type</label>
                    <select
                      className="select-control"
                      value={formData.task_type}
                      onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                    >
                      <option value="watering">Watering</option>
                      <option value="fertilizing">Fertilizing</option>
                      <option value="pruning">Pruning</option>
                      <option value="repotting">Repotting</option>
                      <option value="observation">Health Observation</option>
                      <option value="custom">Custom Task</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="input-control"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Instructions</label>
                  <textarea
                    className="textarea-control"
                    placeholder="Detailed steps or observation checklist..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setNewTaskModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
