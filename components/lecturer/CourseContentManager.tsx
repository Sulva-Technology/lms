"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "motion/react";
import { Archive, FilePlus2, Layers3, Loader2, Plus, Save, Video } from "lucide-react";
import { archiveLessonAction, archiveModuleAction, attachLessonMaterialAction, detachLessonMaterialAction, upsertLessonAction, upsertModuleAction } from "@/app/actions/learning";
import { Drawer } from "@/components/ui/drawer";
import { LessonVideoUploader } from "./LessonVideoUploader";

type Module = Record<string, any>;

type Props = {
  course: Record<string, any>;
  modules: Module[];
};

const inputClass = "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";
const labelClass = "grid gap-2 text-sm font-medium text-ink-muted";

export function CourseContentManager({ course, modules }: Props) {
  const [items, setItems] = useState(modules);
  const [drawer, setDrawer] = useState<"module" | "lesson" | "material" | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Record<string, any> | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const lessonOptions = useMemo(() => items.flatMap((module) => (module.lessons || []).map((lesson: any) => ({ ...lesson, moduleTitle: module.title }))), [items]);

  function submitModule(formData: FormData) {
    const payload = {
      courseId: course.id,
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      orderIndex: Number(formData.get("orderIndex") || items.length),
    };
    run(async () => upsertModuleAction(payload), (data) => setItems((current) => [...current, { ...data, lessons: [] }]), "Module saved.");
  }

  function submitLesson(formData: FormData) {
    const payload = {
      moduleId: String(formData.get("moduleId") || selectedModule?.id || ""),
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      resourceType: String(formData.get("resourceType") || "document"),
      orderIndex: Number(formData.get("orderIndex") || 0),
      isPublished: formData.get("isPublished") === "on",
    };
    run(async () => upsertLessonAction(payload), (data) => {
      setItems((current) => current.map((module) => module.id === data.module_id ? { ...module, lessons: [...(module.lessons || []), data] } : module));
    }, "Lesson saved.");
  }

  function submitMaterial(formData: FormData) {
    const payload = {
      lessonId: String(formData.get("lessonId") || selectedLesson?.id || ""),
      title: String(formData.get("title") || ""),
      materialType: String(formData.get("materialType") || "link"),
      url: String(formData.get("url") || ""),
    };
    run(async () => attachLessonMaterialAction(payload), () => undefined, "Material attached.");
  }

  function archiveModule(moduleId: string) {
    run(async () => archiveModuleAction({ id: moduleId }), () => setItems((current) => current.filter((module) => module.id !== moduleId)), "Module archived.");
  }

  function detachMaterial(lessonId: string, materialId: string) {
    run(async () => detachLessonMaterialAction({ id: materialId }), () => {
      setItems((current) => current.map((module) => ({
        ...module,
        lessons: (module.lessons || []).map((lesson: any) => lesson.id === lessonId
          ? { ...lesson, lesson_materials: (lesson.lesson_materials || []).filter((material: any) => material.id !== materialId) }
          : lesson),
      })));
    }, "Material removed.");
  }

  function archiveLesson(lessonId: string) {
    run(async () => archiveLessonAction({ id: lessonId }), () => {
      setItems((current) => current.map((module) => ({ ...module, lessons: (module.lessons || []).filter((lesson: any) => lesson.id !== lessonId) })));
    }, "Lesson archived.");
  }

  function run(action: () => Promise<any>, onSuccess: (data: any) => void, success: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error);
        return;
      }
      onSuccess(result.data);
      setDrawer(null);
      setMessage(success);
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="panel rounded-[28px] border border-line p-6 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{course.code}</p>
            <h1 className="mt-2 font-outfit text-3xl font-bold text-ink">{course.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{course.description || "Build modules, lessons, and materials for this course."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDrawer("module")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-primary-hover">
              <Layers3 size={16} /> Add Module
            </button>
            <button onClick={() => setDrawer("lesson")} className="inline-flex items-center gap-2 rounded-xl border border-line bg-status-soft px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink/[0.06]">
              <Plus size={16} /> Add Lesson
            </button>
            <button onClick={() => setDrawer("material")} className="inline-flex items-center gap-2 rounded-xl border border-line bg-status-soft px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink/[0.06]">
              <FilePlus2 size={16} /> Attach Material
            </button>
          </div>
        </div>
      </div>

      {(message || error) && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>
          {error || message}
        </motion.div>
      )}

      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="panel rounded-2xl border border-line p-8 text-center text-ink-muted">No modules yet. Add the first module to start building the course.</div>
        ) : items.map((module, index) => (
          <motion.section key={module.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-2xl border border-line bg-surface p-5 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-outfit text-xl font-semibold text-ink">{module.title}</h2>
                {module.description && <p className="mt-1 text-sm text-ink-muted">{module.description}</p>}
              </div>
              <button onClick={() => archiveModule(module.id)} className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20">
                <Archive size={13} /> Archive module
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {(module.lessons || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-subtle">No lessons in this module yet.</p>
              ) : (module.lessons || []).map((lesson: any) => (
                <div key={lesson.id} className="grid gap-3 rounded-xl border border-line bg-status-soft p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{lesson.title}</p>
                      <p className="mt-1 text-xs text-ink-muted">{lesson.resource_type} · {lesson.is_published ? "Published" : "Draft"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedLesson(lesson); setDrawer("material"); }} className="inline-flex items-center gap-1.5 rounded-lg bg-status-soft px-3 py-2 text-xs font-semibold text-ink hover:bg-ink/[0.06]">
                        <Video size={13} /> Material
                      </button>
                      <button onClick={() => archiveLesson(lesson.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20">
                        <Archive size={13} /> Archive
                      </button>
                    </div>
                  </div>
                  {(lesson.lesson_materials || []).length > 0 && (
                    <ul className="grid gap-2">
                      {(lesson.lesson_materials || []).map((material: any) => (
                        <li key={material.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-status-soft px-4 py-2.5">
                          <span className="min-w-0 truncate text-sm text-ink-muted">
                            {material.url ? (
                              <a href={material.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{material.title}</a>
                            ) : material.title}
                            <span className="ml-2 text-xs text-ink-subtle">{material.material_type}</span>
                          </span>
                          <button
                            onClick={() => detachMaterial(lesson.id, material.id)}
                            disabled={pending}
                            className="shrink-0 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <LessonVideoUploader
                    lessonId={lesson.id}
                    courseId={course.id}
                    video={(lesson.video_assets || [])[0] || null}
                  />
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <Drawer isOpen={drawer === "module"} onClose={() => setDrawer(null)} title="Add module" className="max-w-xl">
        <form action={submitModule} className="grid gap-4">
          <label className={labelClass}>Title<input name="title" required className={inputClass} /></label>
          <label className={labelClass}>Description<textarea name="description" rows={4} className={inputClass} /></label>
          <label className={labelClass}>Order<input name="orderIndex" type="number" min={0} defaultValue={items.length} className={inputClass} /></label>
          <SubmitButton pending={pending} label="Save module" />
        </form>
      </Drawer>

      <Drawer isOpen={drawer === "lesson"} onClose={() => setDrawer(null)} title="Add lesson" className="max-w-xl">
        <form action={submitLesson} className="grid gap-4">
          <label className={labelClass}>Module<select name="moduleId" required defaultValue={selectedModule?.id || ""} className={inputClass}>{items.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label>
          <label className={labelClass}>Title<input name="title" required className={inputClass} /></label>
          <label className={labelClass}>Content<textarea name="content" rows={5} className={inputClass} /></label>
          <label className={labelClass}>Type<select name="resourceType" className={inputClass}><option value="document">Document</option><option value="video">Video</option><option value="link">Link</option><option value="other">Other</option></select></label>
          <label className="flex items-center gap-3 rounded-xl border border-line bg-status-soft px-4 py-3 text-sm text-ink-muted"><input name="isPublished" type="checkbox" className="h-4 w-4 accent-violet-500" /> Publish immediately</label>
          <SubmitButton pending={pending} label="Save lesson" />
        </form>
      </Drawer>

      <Drawer isOpen={drawer === "material"} onClose={() => setDrawer(null)} title="Attach material" className="max-w-xl">
        <form action={submitMaterial} className="grid gap-4">
          <label className={labelClass}>Lesson<select name="lessonId" required defaultValue={selectedLesson?.id || ""} className={inputClass}>{lessonOptions.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.moduleTitle} / {lesson.title}</option>)}</select></label>
          <label className={labelClass}>Title<input name="title" required className={inputClass} /></label>
          <label className={labelClass}>Type<select name="materialType" className={inputClass}><option value="link">Link</option><option value="file">File URL</option><option value="video">Video URL</option></select></label>
          <label className={labelClass}>URL<input name="url" type="url" className={inputClass} placeholder="https://..." /></label>
          <SubmitButton pending={pending} label="Attach material" />
        </form>
      </Drawer>
    </div>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-ink transition hover:bg-primary-hover disabled:opacity-60">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {label}
    </button>
  );
}
