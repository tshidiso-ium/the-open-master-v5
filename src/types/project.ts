export type ProjectStatus = "pending" | "active" | "finished";
export type UserRole = "architect" | "engineer" | "developer";
export type ToDoStatus = "todo" | "in-progress" | "done";

export interface ProjectTodo {
  id: string;
  title: string;
  description: string;
  status: ToDoStatus;
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  userRole: UserRole;
  cost: number;
  finishDate: string;
  todos: ProjectTodo[];
}

export type ProjectInput = Omit<Project, "id">;
