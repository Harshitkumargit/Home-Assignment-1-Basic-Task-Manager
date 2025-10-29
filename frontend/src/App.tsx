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

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedTasks = await taskService.getAllTasks();
      setTasks(loadedTasks);
    } catch (err) {
      setError('Unable to connect to server. Working in offline mode.');
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-center">
            <div className="flex items-center justify-center mb-3">
              <svg className="w-12 h-12 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h1 className="text-4xl font-bold text-white">Task Manager</h1>
            </div>
            <p className="text-indigo-100 text-lg">Organize your tasks efficiently</p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg animate-pulse">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="mb-8">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 placeholder-gray-400"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || newTaskDescription.trim() === ''}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '+ Add'
                  )}
                </button>
              </div>
            </form>

            {/* Filter Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition duration-200 transform hover:scale-105 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition duration-200 transform hover:scale-105 ${
                  filter === 'active'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition duration-200 transform hover:scale-105 ${
                  filter === 'completed'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* Task List */}
            {isLoading && tasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-500 text-lg">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-xl font-medium">
                  {filter === 'all'
                    ? 'No tasks yet. Add one to get started!'
                    : filter === 'active'
                    ? 'No active tasks. Great job! 🎉'
                    : 'No completed tasks yet.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredTasks.map(task => (
                  <li
                    key={task.id}
                    className="group flex items-center gap-4 p-5 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition duration-200 border border-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => handleToggleComplete(task)}
                      className="w-6 h-6 text-indigo-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer transition duration-200"
                    />
                    
                    {editingTaskId === task.id ? (
                      <>
                        <input
                          type="text"
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          className="flex-1 px-4 py-2 text-lg border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(task)}
                          className="px-5 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition duration-200 shadow-md hover:shadow-lg"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-5 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition duration-200 shadow-md hover:shadow-lg"
                        >
                          ✕ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`flex-1 text-lg ${
                            task.isCompleted
                              ? 'line-through text-gray-400'
                              : 'text-gray-800 font-medium'
                          }`}
                        >
                          {task.description}
                        </span>
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="px-5 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition duration-200 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={task.isCompleted}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-5 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition duration-200 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Footer Stats */}
            {tasks.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <div className="flex justify-between items-center text-gray-600">
                  <span className="text-lg font-medium">
                    <span className="text-indigo-600 font-bold">{tasks.length}</span> Total Tasks
                  </span>
                  <span className="text-lg font-medium">
                    {activeCount > 0 ? (
                      <>
                        <span className="text-orange-600 font-bold">{activeCount}</span> task{activeCount === 1 ? '' : 's'} remaining
                      </>
                    ) : (
                      <span className="text-green-600 font-bold">All tasks completed! 🎉</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
