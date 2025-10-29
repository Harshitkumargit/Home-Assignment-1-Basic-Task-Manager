import React, { useState, useEffect } from 'react';
import { taskService } from './services/api';
import { Task, TaskFilter } from './types/Task';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Check if all tasks completed
    const allCompleted = tasks.length > 0 && tasks.every(t => t.isCompleted);
    if (allCompleted && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [tasks]);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedTasks = await taskService.getAllTasks();
      setTasks(loadedTasks);
      setIsOnline(true);
    } catch (err) {
      setError('Failed to connect to server. Working in offline mode.');
      setIsOnline(false);
      console.error('Error loading tasks:', err);
      
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newTaskDescription.trim() === '') {
      setError('Please enter a task description');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const newTask = await taskService.createTask(newTaskDescription);
      setTasks([...tasks, newTask]);
      setNewTaskDescription('');
    } catch (err) {
      setError('Failed to add task. Please try again.');
      console.error('Error adding task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const updatedTask = { ...task, isCompleted: !task.isCompleted };
    
    try {
      await taskService.updateTask(updatedTask);
      setTasks(tasks.map(t => (t.id === task.id ? updatedTask : t)));
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingDescription(task.description);
  };

  const handleSaveEdit = async (task: Task) => {
    if (editingDescription.trim() === '') {
      setError('Task description cannot be empty');
      return;
    }

    const updatedTask = { ...task, description: editingDescription };
    
    try {
      await taskService.updateTask(updatedTask);
      setTasks(tasks.map(t => (t.id === task.id ? updatedTask : t)));
      setEditingTaskId(null);
      setEditingDescription('');
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingDescription('');
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskService.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', err);
    }
  };

  const getFilteredTasks = (): Task[] => {
    switch (filter) {
      case 'active':
        return tasks.filter(t => !t.isCompleted);
      case 'completed':
        return tasks.filter(t => t.isCompleted);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const activeCount = tasks.filter(t => !t.isCompleted).length;
  const completedCount = tasks.filter(t => t.isCompleted).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${20 + Math.random() * 20}px`,
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn">
          {/* Header with Connection Status */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2 animate-slideDown">
              <h1 className="text-4xl font-bold text-gray-800 hover:scale-110 transition-transform duration-300">
                📝 Task Manager
              </h1>
            </div>
            <p className="text-gray-600 animate-slideDown" style={{ animationDelay: '0.1s' }}>
              Organize your tasks efficiently
            </p>
            
            {/* Connection Status with Refresh Button */}
            <div className="mt-3 flex items-center justify-center gap-2 animate-slideDown" style={{ animationDelay: '0.2s' }}>
              {isOnline ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-bounceIn">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-bounceIn">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Offline Mode
                </span>
              )}
              <button
                onClick={loadTasks}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-all hover:scale-110 active:scale-95"
                title="Refresh tasks"
              >
                <svg className="w-3 h-3 mr-1 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded animate-shake">
              <div className="flex items-center">
                <span className="text-xl mr-2 animate-bounce">⚠️</span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm underline hover:no-underline transition"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleAddTask} className="mb-8 animate-slideUp">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-5 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:scale-105"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || newTaskDescription.trim() === ''}
                className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95 hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  '+ Add'
                )}
              </button>
            </div>
          </form>

          {/* Filter Buttons - Active has only green dot, no icon */}
          <div className="flex gap-3 mb-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 ${
                filter === 'all'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="inline-block mr-1">📋</span>
              All ({tasks.length})
            </button>
            
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 ${
                filter === 'active'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse-glow align-middle"></span>
              Active ({activeCount})
            </button>
            
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 ${
                filter === 'completed'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="inline-block mr-1">✅</span>
              Completed ({completedCount})
            </button>
          </div>

          {isLoading && tasks.length === 0 ? (
            <div className="text-center py-12 animate-pulse">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-500">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 animate-fadeIn">
              <p className="text-6xl mb-4 animate-bounce-slow">📭</p>
              <p className="text-gray-500 text-lg">
                {filter === 'all'
                  ? 'No tasks yet. Add one to get started!'
                  : filter === 'active'
                  ? 'No active tasks. Great job! 🎉'
                  : 'No completed tasks yet.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTasks.map((task, index) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all shadow-sm hover:shadow-md transform hover:scale-102 animate-slideIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => handleToggleComplete(task)}
                    className="w-6 h-6 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transition-transform hover:scale-110 active:scale-90"
                  />
                  
                  {editingTaskId === task.id ? (
                    <>
                      <input
                        type="text"
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-blue-500 rounded focus:outline-none animate-fadeIn"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(task)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-all transform hover:scale-110 active:scale-95"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all transform hover:scale-110 active:scale-95"
                      >
                        ✕ Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`flex-1 text-lg transition-all duration-300 ${
                          task.isCompleted
                            ? 'line-through text-gray-400 scale-95'
                            : 'text-gray-800'
                        }`}
                      >
                        {task.description}
                      </span>
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={task.isCompleted}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all transform hover:scale-110 active:scale-95 hover:rotate-3"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {tasks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 animate-fadeIn">
              <div className="flex justify-between text-sm text-gray-600">
                <span className="transition-all hover:scale-110">
                  Total Tasks: <span className="font-bold text-blue-600">{tasks.length}</span>
                </span>
                <span className="transition-all hover:scale-110">
                  {activeCount > 0 ? (
                    <>
                      <span className="font-bold text-orange-600">{activeCount}</span> task{activeCount === 1 ? '' : 's'} remaining
                    </>
                  ) : (
                    <span className="font-bold text-green-600 animate-bounce">All tasks completed! 🎉</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
