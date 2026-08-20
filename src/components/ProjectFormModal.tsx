import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectInput, ProjectStatus, UserRole } from "../types/project";

interface ProjectFormModalProps {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSubmit: (project: ProjectInput) => Promise<void> | void;
}

const today = new Date().toISOString().slice(0, 10);

export function ProjectFormModal({ open, project, onClose, onSubmit }: ProjectFormModalProps) {
  const initialValue = useMemo<ProjectInput>(() => ({
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "pending",
    userRole: project?.userRole ?? "architect",
    cost: project?.cost ?? 0,
    finishDate: project?.finishDate ?? today,
    todos: project?.todos ?? []
  }), [project]);

  const [form, setForm] = useState<ProjectInput>(initialValue);
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
        name: form.name.trim(),
        description: form.description.trim(),
        cost: Number(form.cost) || 0
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-panel" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{project ? "Edit Project" : "New Project"}</h2>
          <button className="icon-button" type="button" aria-label="Close" title="Close" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="input-list">
          <label className="form-field">
            <span><span className="material-symbols-rounded">apartment</span>Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Project name"
              required
            />
          </label>

          <label className="form-field">
            <span><span className="material-symbols-rounded">subject</span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Project description"
              rows={4}
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span><span className="material-symbols-rounded">person</span>Role</span>
              <select
                value={form.userRole}
                onChange={(event) => setForm((current) => ({ ...current, userRole: event.target.value as UserRole }))}
              >
                <option value="architect">architect</option>
                <option value="engineer">engineer</option>
                <option value="developer">developer</option>
              </select>
            </label>

            <label className="form-field">
              <span><span className="material-symbols-rounded">flag</span>Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))}
              >
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="finished">finished</option>
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span><span className="material-symbols-rounded">paid</span>Cost</span>
              <input
                type="number"
                value={form.cost}
                onChange={(event) => setForm((current) => ({ ...current, cost: Number(event.target.value) }))}
                min={0}
              />
            </label>

            <label className="form-field">
              <span><span className="material-symbols-rounded">calendar_month</span>Finish Date</span>
              <input
                type="date"
                value={form.finishDate}
                onChange={(event) => setForm((current) => ({ ...current, finishDate: event.target.value }))}
              />
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
