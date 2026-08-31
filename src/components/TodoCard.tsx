import type { ProjectTodo } from "../types/project";

interface TodoCardProps {
  todo: ProjectTodo;
  onClick: () => void;
}

export function TodoCard({ todo, onClick }: TodoCardProps) {
  return (
    <button
      className={`todo-item ${todo.status} priority-${todo.priority}`}
      type="button"
      onClick={onClick}
      aria-label={`Edit ${todo.title}`}
    >
      <span className="todo-title">
        <span className="material-symbols-rounded" aria-hidden="true">construction</span>
        {todo.title}
      </span>
      <span className="todo-meta">
        <span className={`todo-priority priority-${todo.priority}`}>
          {todo.priority} priority
        </span>
        <span>{todo.dueDate || "No date"}</span>
      </span>
    </button>
  );
}
