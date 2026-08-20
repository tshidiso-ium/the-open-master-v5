import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import type { Project, ProjectInput, ProjectTodo, ToDoStatus } from "../types/project";

const COLLECTION_NAME = "projects";

function getProjectsCollection() {
  if (!db) {
    throw new Error("Firebase is not configured. Add your VITE_FIREBASE_* values to .env.");
  }

  return collection(db, COLLECTION_NAME);
}

function normalizeTodo(value: unknown, index: number): ProjectTodo | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const todo = value as Partial<ProjectTodo>;
  const status: ToDoStatus =
    todo.status === "in-progress" || todo.status === "done" ? todo.status : "todo";

  return {
    id: typeof todo.id === "string" && todo.id ? todo.id : `${index}`,
    title: typeof todo.title === "string" ? todo.title : "",
    description: typeof todo.description === "string" ? todo.description : "",
    status,
    dueDate: typeof todo.dueDate === "string" ? todo.dueDate : ""
  };
}

function normalizeProject(id: string, data: Record<string, unknown>): Project {
  const todos = Array.isArray(data.todos)
    ? data.todos.map(normalizeTodo).filter((todo): todo is ProjectTodo => Boolean(todo))
    : [];

  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    status: data.status === "active" || data.status === "finished" ? data.status : "pending",
    userRole: data.userRole === "engineer" || data.userRole === "developer" ? data.userRole : "architect",
    cost: Number(data.cost ?? 0),
    finishDate: String(data.finishDate ?? new Date().toISOString().slice(0, 10)),
    todos
  };
}

export function subscribeToProjects(
  onProjects: (projects: Project[]) => void,
  onError: (error: Error) => void
): Unsubscribe | null {
  if (!db) {
    return null;
  }

  return onSnapshot(
    getProjectsCollection(),
    (snapshot) => {
      const projects = snapshot.docs.map((projectDoc) => normalizeProject(projectDoc.id, projectDoc.data()));
      onProjects(projects);
    },
    onError
  );
}

export async function createProject(project: ProjectInput) {
  const docRef = await addDoc(getProjectsCollection(), {
    ...project,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

export async function updateProject(id: string, project: Partial<ProjectInput>) {
  await updateDoc(doc(getProjectsCollection(), id), {
    ...project,
    updatedAt: serverTimestamp()
  });
}

export async function upsertImportedProject(project: Project) {
  await setDoc(doc(getProjectsCollection(), project.id), {
    name: project.name,
    description: project.description,
    status: project.status,
    userRole: project.userRole,
    cost: project.cost,
    finishDate: project.finishDate,
    todos: project.todos,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

export async function deleteProject(id: string) {
  await deleteDoc(doc(getProjectsCollection(), id));
}
