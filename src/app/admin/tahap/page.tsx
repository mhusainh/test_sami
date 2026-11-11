"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Stage = { id: string; name: string; order: number; is_terminal: boolean };

function SortableStage({
  stage,
  onRename,
  onDelete,
  onToggleTerminal,
}: {
  stage: Stage;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onToggleTerminal: (id: string, v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
    >
      <button
        type="button"
        aria-label="Geser untuk mengubah urutan"
        className="cursor-grab touch-none select-none rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      <span className="w-8 shrink-0 text-sm font-bold tabular-nums text-slate-400">{stage.order}</span>

      <input
        className="input flex-1"
        value={stage.name}
        onChange={(e) => onRename(stage.id, e.target.value)}
        onBlur={(e) => onRename(stage.id, e.target.value.trim() || stage.name)}
        aria-label={`Nama tahap ${stage.name}`}
      />

      <label className="flex shrink-0 items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={stage.is_terminal}
          onChange={(e) => onToggleTerminal(stage.id, e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
        />
        Tahap akhir
      </label>

      <button
        type="button"
        onClick={() => onDelete(stage.id)}
        className="shrink-0 text-sm font-medium text-red-600 hover:underline"
      >
        Hapus
      </button>
    </li>
  );
}

export default function TahapPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/stages");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat");
      setStages(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function persistOrder(items: Stage[]) {
    const body = items.map((s, i) => ({ id: s.id, order: i + 1 }));
    const res = await fetch("/api/stages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: body }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal simpan urutan");
    setStages(json.data);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setStages((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const next = arrayMove(items, oldIndex, newIndex).map((s, idx) => ({ ...s, order: idx + 1 }));
      persistOrder(next)
        .then(() => {
          setMsg("Urutan tahap diperbarui.");
          setError("");
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Gagal simpan urutan");
          load();
        });
      return next;
    });
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setMsg("");
    setError("");
    const res = await fetch("/api/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal menambah");
      return;
    }
    setNewName("");
    setMsg("Tahap ditambahkan.");
    await load();
  }

  async function renameStage(id: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    const res = await fetch("/api/stages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Gagal rename");
      load();
    } else {
      setMsg("Nama tahap disimpan.");
      setError("");
    }
  }

  async function toggleTerminal(id: string, is_terminal: boolean) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, is_terminal } : s)));
    await fetch("/api/stages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_terminal }),
    });
  }

  async function deleteStage(id: string) {
    if (!confirm("Hapus tahap ini?")) return;
    setMsg("");
    setError("");
    const res = await fetch(`/api/stages?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal hapus");
      return;
    }
    setMsg("Tahap dihapus.");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tahap Progres</h1>
        <p className="text-sm text-slate-600">
          Tambah, hapus, rename, dan geser urutan tahap (drag & drop). Urutan dipakai di board dan
          alur pelamar.
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={addStage} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="newStage">
            Tahap baru
          </label>
          <input
            id="newStage"
            className="input"
            placeholder="mis. USER INTERVIEW"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">
          Tambah Tahap
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {stages.map((stage) => (
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  onRename={renameStage}
                  onDelete={deleteStage}
                  onToggleTerminal={toggleTerminal}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-slate-500">
        Default: DIKIRIM → PSIKOTEST → WAWANCARA → DITERIMA. Tahap yang masih dipakai pelamar tidak
        bisa dihapus.
      </p>
    </div>
  );
}
