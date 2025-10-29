export interface Task {
  id: number;
  description: string;
  isCompleted: boolean;
  createdAt?: string;
}

export type TaskFilter = 'all' | 'active' | 'completed';
