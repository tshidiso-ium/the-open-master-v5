import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectFormModal } from "./components/ProjectFormModal";
import { TodoModal } from "./components/TodoModal";
import { ModelViewer } from "./components/ModelViewer";
import { ProjectTasksList } from "./components/ProjectTasksList";
import { SearchBox } from "./components/SearchBox";
import { firebaseEnabled } from "./services/firebase";
import {
  createProject,
  deleteProject as removeProject,
  subscribeToProjects,
  updateProject,
  upsertImportedProject
} from "./services/projectsRepository";
import type { Project, ProjectInput, ProjectTodo } from "./types/project";
import { appIcons } from "./globals";

const projectColors = ["#ca8134", "#4a90e2", "#8e44ad", "#16a085", "#f39c12", "#d35400"];

type AppRoute =
  | { name: "projects" }
  | { name: "projectDetails"; projectId: string };

const defaultProject: Project = {
  id: "default-project",
  name: "Default Project",
  description: "This is just a default app project",
  status: "pending",
  userRole: "architect",
  cost: 0,
  finishDate: new Date().toISOString().slice(0, 10),
  todos: []
};

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

function getProjectColor(id: string) {
  const total = id.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  return projectColors[total % projectColors.length];
}

function normalizeImportedTodo(value: unknown, fallbackId: string): ProjectTodo | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const todo = value as Partial<ProjectTodo>;

  return {
    id: typeof todo.id === "string" && todo.id ? todo.id : fallbackId,
    title: typeof todo.title === "string" ? todo.title : "",
    description: typeof todo.description === "string" ? todo.description : "",
    status: todo.status === "in-progress" || todo.status === "done" ? todo.status : "todo",
    priority: todo.priority === "low" || todo.priority === "high" ? todo.priority : "medium",
    dueDate: typeof todo.dueDate === "string" ? todo.dueDate : ""
  };
}

function normalizeImportedProject(value: Partial<Project>, fallbackId: string): Project {
  const todos = Array.isArray(value.todos)
    ? value.todos
      .map((todo, index) => normalizeImportedTodo(todo, `${fallbackId}-todo-${index}`))
      .filter((todo): todo is ProjectTodo => Boolean(todo))
    : [];

  return {
    id: typeof value.id === "string" && value.id ? value.id : fallbackId,
    name: typeof value.name === "string" ? value.name : "Imported Project",
    description: typeof value.description === "string" ? value.description : "",
    status: value.status === "active" || value.status === "finished" ? value.status : "pending",
    userRole: value.userRole === "engineer" || value.userRole === "developer" ? value.userRole : "architect",
    cost: Number(value.cost ?? 0),
    finishDate: typeof value.finishDate === "string"
      ? value.finishDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    todos
  };
}

function parseRoute(pathname = window.location.pathname): AppRoute {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath.startsWith("/projects/")) {
    return {
      name: "projectDetails",
      projectId: decodeURIComponent(normalizedPath.replace("/projects/", ""))
    };
  }

  return { name: "projects" };
}

function projectRoute(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}`;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(firebaseEnabled ? [] : [defaultProject]);
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<ProjectTodo | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [todoSearch, setTodoSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(firebaseEnabled);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function navigateToProjects() {
    window.history.pushState({}, "", "/projects");
    setRoute({ name: "projects" });
  }

  function navigateToProject(projectId: string) {
    window.history.pushState({}, "", projectRoute(projectId));
    setRoute({ name: "projectDetails", projectId });
  }

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute());
    };

    window.addEventListener("popstate", handlePopState);

    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/projects");
      setRoute({ name: "projects" });
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) {
      return;
    }

    const unsubscribe = subscribeToProjects(
      (nextProjects) => {
        setProjects(nextProjects);
        setLoading(false);
      },
      (subscriptionError) => {
        setError(subscriptionError.message);
        setProjects((current) => current.length > 0 ? current : [defaultProject]);
        setLoading(false);
      }
    );

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    setTodoSearch("");
    setEditingTodo(null);
  }, [route]);

  const selectedProject = useMemo(
    () => route.name === "projectDetails"
      ? projects.find((project) => project.id === route.projectId) ?? null
      : null,
    [projects, route]
  );

  const visibleProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const searchableText = [
        project.name,
        project.description,
        project.status,
        project.userRole,
        String(project.cost)
      ].join(" ").toLowerCase();

      return searchableText.includes(query);
    });
  }, [projectSearch, projects]);

  const visibleTodos = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    const query = todoSearch.trim().toLowerCase();
    if (!query) {
      return selectedProject.todos;
    }

    return selectedProject.todos.filter((todo) => todo.title.toLowerCase().includes(query));
  }, [selectedProject, todoSearch]);

  function validateProject(project: ProjectInput, currentId?: string) {
    if (project.name.trim().length < 5) {
      throw new Error("Project name must be at least 5 characters.");
    }

    const duplicate = projects.some((item) => item.id !== currentId && item.name.toLowerCase() === project.name.toLowerCase());
    if (duplicate) {
      throw new Error(`A project with the name "${project.name}" already exists.`);
    }
  }

  async function handleProjectSubmit(project: ProjectInput) {
    try {
      setError("");
      validateProject(project, editingProject?.id);

      if (editingProject) {
        if (firebaseEnabled) {
          await updateProject(editingProject.id, project);
        } else {
          setProjects((current) => current.map((item) => item.id === editingProject.id ? { ...item, ...project } : item));
        }
        setEditingProject(null);
        return;
      }

      if (firebaseEnabled) {
        const id = await createProject(project);
        navigateToProject(id);
      } else {
        const nextProject = { id: newId(), ...project };
        setProjects((current) => [...current, nextProject]);
        navigateToProject(nextProject.id);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Project could not be saved.");
      throw saveError;
    }
  }

  async function persistProject(nextProject: Project) {
    if (firebaseEnabled) {
      await updateProject(nextProject.id, {
        name: nextProject.name,
        description: nextProject.description,
        status: nextProject.status,
        userRole: nextProject.userRole,
        cost: nextProject.cost,
        finishDate: nextProject.finishDate,
        todos: nextProject.todos
      });
    } else {
      setProjects((current) => current.map((project) => project.id === nextProject.id ? nextProject : project));
    }
  }

  async function handleTodoSubmit(todo: ProjectTodo) {
    if (!selectedProject) {
      return;
    }

    try {
      setError("");
      const todoExists = selectedProject.todos.some((item) => item.id === todo.id);
      const nextTodos = todoExists
        ? selectedProject.todos.map((item) => item.id === todo.id ? todo : item)
        : [...selectedProject.todos, todo];

      await persistProject({ ...selectedProject, todos: nextTodos });
      setEditingTodo(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "To-do could not be saved.");
      throw saveError;
    }
  }

  async function handleDeleteProject() {
    if (!selectedProject) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedProject.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      if (firebaseEnabled) {
        await removeProject(selectedProject.id);
      } else {
        setProjects((current) => current.filter((project) => project.id !== selectedProject.id));
      }

      navigateToProjects();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Project could not be deleted.");
    }
  }

  function exportProjects() {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "projects.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importProjects(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = Array.isArray(parsed) ? parsed : [parsed];
        const normalized = incoming.map((item) => normalizeImportedProject(item, newId()));

        if (firebaseEnabled) {
          await Promise.all(normalized.map(upsertImportedProject));
        } else {
          setProjects((current) => {
            const byName = new Map(current.map((project) => [project.name.toLowerCase(), project]));
            const next = [...current];
            for (const importedProject of normalized) {
              const existing = byName.get(importedProject.name.toLowerCase());
              if (existing) {
                const index = next.findIndex((project) => project.id === existing.id);
                next[index] = { ...importedProject, id: existing.id };
              } else {
                next.push(importedProject);
              }
            }
            return next;
          });
        }
      } catch (importError) {
        setError(importError instanceof Error ? importError.message : "Projects could not be imported.");
      } finally {
        event.target.value = "";
      }
    });
    reader.readAsText(file);
  }

  return (
    <>
      <aside className="sidebar">
        <img className="company-logo" src="/assets/company-logo.svg" alt="Construction Company" />
        <nav className="nav-buttons" aria-label="Main navigation">
          <button className={`nav-button ${route.name === "projects" ? "active" : ""}`} type="button" onClick={navigateToProjects}>
            <span className="material-symbols-rounded">apartment</span>
            Projects
          </button>
          <button className="nav-button" type="button">
            <span className="material-symbols-rounded">group</span>
            Users
          </button>
        </nav>
      </aside>

      <main className="content">
        <section className="page">
          <header className="page-header">
            <div>
              <h1>{route.name === "projects" ? "Projects" : "Project Details"}</h1>
              <p>
                {route.name === "projects"
                  ? `${projects.length} active workspace${projects.length === 1 ? "" : "s"}`
                  : selectedProject?.name ?? "No project selected"}
              </p>
            </div>
            {
              route.name === "projects" ? 
            <div className="projects-toolbar">
              <SearchBox
                value={projectSearch}
                onChange={setProjectSearch}
                placeholder="Search projects"
                ariaLabel="Search projects"
                className="project-search-field"
              />
              {projectSearch && (
                <button className="secondary-button" type="button" onClick={() => setProjectSearch("")}>
                  Clear
                </button>
              )}
            </div>
              : 
              <>
              </>
            }
            <div className="header-actions">
              {route.name === "projectDetails" && (
                <button className="secondary-button" type="button" onClick={navigateToProjects}>
                  <span className="material-symbols-rounded">arrow_back</span>
                  Back
                </button>
              )}
              {route.name === "projects" && (
                <>
                  <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={importProjects} />
                  <button className="icon-button" type="button" aria-label="Import projects" title="Import projects" onClick={() => fileInputRef.current?.click()}>
                    <span className="material-symbols-rounded">file_upload</span>
                  </button>
                  <button className="icon-button" type="button" aria-label="Export projects" title="Export projects" onClick={exportProjects}>
                    <span className="material-symbols-rounded">file_download</span>
                  </button>
                  <button type="button" onClick={() => { setEditingProject(null); setProjectModalOpen(true); }}>
                    <span className="material-symbols-rounded">add</span>
                    New Project
                  </button>
                </>
              )}
            </div>
          </header>

          {error && <p className="status-message error">{error}</p>}
          {!firebaseEnabled && <p className="status-message">Firebase is not configured. Data is stored in memory until `.env` is added.</p>}

          {route.name === "projects" && (
          <div className="workspace projects-workspace">
            <section className="projects-panel" aria-label="Project list">
              {loading && <p className="empty-state">Loading projects...</p>}
              {!loading && projects.length === 0 && <p className="empty-state">No projects yet.</p>}
              {!loading && projects.length > 0 && visibleProjects.length === 0 && <p className="empty-state">No matching projects found.</p>}
              <div className="projects-list">
                {/* project card */}
                {visibleProjects.map((project) => (
                  <div
                    className="project-card"
                    key={project.id}
                    onClick={() => navigateToProject(project.id)}
                  >
                    <div className="card-header">
                      <span className="project-icon" style={{ backgroundColor: getProjectColor(project.id) }}>{getInitials(project.name)}</span>
                      <span>
                        <strong>{project.name}</strong>
                        <bim-label>{project.description}</bim-label>
                      </span>
                    </div>
                    <div className="card-content">
                      <span><bim-label icon={appIcons.STATUS}>Status:</bim-label>{project.status}</span>
                      <span><bim-label icon={appIcons.ROLE}>Role:</bim-label>{project.userRole}</span>
                      <span><bim-label icon={appIcons.COST}>Cost:</bim-label>${project.cost.toLocaleString()}</span>
                      <span><bim-label icon={appIcons.TODO}>To-Do:</bim-label>{project.todos.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          )}

          {route.name === "projectDetails" && (
          <div className="workspace details-workspace">
            <section className="details-area" aria-label="Project details">
              {selectedProject ? (
                <>
                  <div className="details-grid">
                    <article className="dashboard-card project-summary">
                      <div className="summary-header">
                        <span className="details-icon" style={{ backgroundColor: getProjectColor(selectedProject.id) }}>
                          {getInitials(selectedProject.name)}
                        </span>
                        <div className="summary-actions">
                          <button className="secondary-button" type="button" onClick={() => { setEditingProject(selectedProject); setProjectModalOpen(true); }}>
                            Edit
                          </button>
                          <button className="danger-button" type="button" onClick={handleDeleteProject}>
                            Delete
                          </button>
                        </div>
                      </div>
                      <h2>{selectedProject.name}</h2>
                      <p>{selectedProject.description}</p>
                      <div className="summary-stats">
                        <span><small>Status</small>{selectedProject.status}</span>
                        <span><small>Cost</small>${selectedProject.cost.toLocaleString()}</span>
                        <span><small>Role</small>{selectedProject.userRole}</span>
                        <span><small>Finish Date</small>{selectedProject.finishDate}</span>
                      </div>
                      <div className="progress-bar" aria-label="Estimated progress">
                        <span style={{ width: selectedProject.status === "finished" ? "100%" : selectedProject.status === "active" ? "60%" : "15%" }}>
                          {selectedProject.status === "finished" ? "100%" : selectedProject.status === "active" ? "60%" : "15%"}
                        </span>
                      </div>
                    </article>

                    <article className="dashboard-card todos-panel">
                      <div className="todos-header">
                        <h2>To-Do</h2>
                        <div className="todo-tools">
                          <SearchBox
                            value={todoSearch}
                            onChange={setTodoSearch}
                            placeholder="Search to-dos"
                            ariaLabel="Search to-dos"
                          />
                          <button className="icon-button" type="button" aria-label="Add to-do" title="Add to-do" onClick={() => { setEditingTodo(null); setTodoModalOpen(true); }}>
                            <span className="material-symbols-rounded">add</span>
                          </button>
                        </div>
                      </div>

                      <ProjectTasksList
                        todos={visibleTodos}
                        onTodoClick={(todo) => { setEditingTodo(todo); setTodoModalOpen(true); }}
                      />
                    </article>
                  </div>

                  <article className="dashboard-card viewer-card">
                    <ModelViewer />
                  </article>
                </>
              ) : loading ? (
                <p className="empty-state">Loading project...</p>
              ) : (
                <p className="empty-state">Project not found.</p>
              )}
            </section>
          </div>
          )}
        </section>
      </main>

      <ProjectFormModal
        open={projectModalOpen}
        project={editingProject}
        onClose={() => { setProjectModalOpen(false); setEditingProject(null); }}
        onSubmit={handleProjectSubmit}
      />
      <TodoModal
        open={todoModalOpen}
        todo={editingTodo}
        onClose={() => { setTodoModalOpen(false); setEditingTodo(null); }}
        onSubmit={handleTodoSubmit}
      />
    </>
  );
}
