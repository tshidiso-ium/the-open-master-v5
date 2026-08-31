import type { ProjectTodo } from "../types/project";
import { TodoCard } from "./TodoCard";

interface ProjectTasksListProps {
  todos: ProjectTodo[];
  onTodoClick: (todo: ProjectTodo) => void;
}

export function ProjectTasksList({ todos, onTodoClick }: ProjectTasksListProps) {
  return (
    <div className="todos-list">
      {todos.length === 0 && <p className="empty-state">No to-dos found.</p>}
      {todos.map((todo) => (
        <TodoCard key={todo.id} todo={todo} onClick={() => onTodoClick(todo)} />
      ))}
    </div>
  );
}
