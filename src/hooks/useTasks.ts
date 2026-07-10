import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, TASKS } from '@/data/mockData';
import { useSession } from './useSession';

export function useTasks() {
  const session = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>({});

  async function fetch() {
    if (!session || session.user.is_anonymous) {
      setTasks(TASKS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('polenbee_tasks')
      .select('id, title, scheduled_for, type, done, polenbee_apiaries(name)')
      .order('scheduled_for');

    if (data) {
      const mapped: Task[] = data.map((row: any) => ({
        id: row.id,
        type: row.type as Task['type'],
        title: row.title,
        date: new Date(row.scheduled_for).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        apiary: row.polenbee_apiaries?.name ?? '',
        done: row.done,
      }));
      setTasks(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { if (session !== undefined) fetch(); }, [session]);

  function isDone(t: Task) {
    return doneOverrides[t.id] !== undefined ? doneOverrides[t.id] : t.done;
  }

  async function toggleTask(id: string, current: boolean) {
    const next = !current;
    setDoneOverrides((prev) => ({ ...prev, [id]: next }));
    if (session && !session.user.is_anonymous) {
      await supabase.from('polenbee_tasks').update({ done: next }).eq('id', id);
    }
  }

  async function addTask(
    title: string,
    scheduledFor: string,
    type: Task['type'],
    apiaryId?: string,
    apiaryName?: string
  ) {
    if (!session || session.user.is_anonymous) {
      const newTask: Task = {
        id: `local-${Date.now()}`,
        title,
        type,
        date: scheduledFor,
        apiary: apiaryName ?? '',
        done: false,
      };
      setTasks((prev) => [newTask, ...prev]);
      return;
    }
    const { data, error } = await supabase
      .from('polenbee_tasks')
      .insert({
        user_id: session.user.id,
        title,
        scheduled_for: scheduledFor,
        type,
        apiary_id: apiaryId || null,
      })
      .select('id, title, scheduled_for, type, done, polenbee_apiaries(name)')
      .single();
    if (!error && data) {
      const row = data as any;
      const newTask: Task = {
        id: row.id,
        title: row.title,
        type: row.type as Task['type'],
        date: new Date(row.scheduled_for).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        apiary: row.polenbee_apiaries?.name ?? apiaryName ?? '',
        done: false,
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  }

  async function updateTask(
    id: string,
    title: string,
    scheduledFor: string,
    type: Task['type'],
    apiaryId?: string,
    apiaryName?: string
  ) {
    const formatted = (() => {
      const d = new Date(scheduledFor);
      return isNaN(d.getTime()) ? scheduledFor : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    })();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title, date: formatted, type, apiary: apiaryName ?? t.apiary }
          : t
      )
    );
    if (session && !session.user.is_anonymous) {
      await supabase.from('polenbee_tasks').update({
        title,
        scheduled_for: scheduledFor,
        type,
        apiary_id: apiaryId || null,
      }).eq('id', id);
    }
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (session && !session.user.is_anonymous) {
      await supabase.from('polenbee_tasks').delete().eq('id', id);
    }
  }

  return { tasks, loading, isDone, toggleTask, addTask, updateTask, deleteTask };
}
