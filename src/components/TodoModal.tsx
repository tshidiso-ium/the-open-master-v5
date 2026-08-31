import { useEffect, useMemo, useState } from "react";
import type { ProjectTodo, ToDoPriority, ToDoStatus } from "../types/project";

interface TodoModalProps {
  open: boolean;
  todo?: ProjectTodo | null;
  onClose: () => void;
  onSubmit: (todo: ProjectTodo) => Promise<void> | void;
}

const emptyTodo: ProjectTodo = {
  id: "",
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: ""
};

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TodoModal({ open, todo, onClose, onSubmit }: TodoModalProps) {
  const initialValue = useMemo(() => todo ?? emptyTodo, [todo]);
  const [form, setForm] = useState<ProjectTodo>(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialValue);
    }
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSubmit({
        ...form,
        id: form.id || newId(),
        title: form.title.trim(),
        description: form.description.trim()
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-panel compact-modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{todo ? "Edit To-Do" : "New To-Do"}</h2>
          <button className="icon-button" type="button" aria-label="Close" title="Close" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="input-list">
          <label className="form-field">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="To-do title"
              required
            />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              rows={4}
            />
          </label>

          <div className="form-grid todo-form-grid">
            <label className="form-field">
              <span>Due Date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ToDoStatus }))}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>

            <label className="form-field">
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  priority: event.target.value as ToDoPriority
                }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={isSaving}>{isSaving ? "Saving" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
