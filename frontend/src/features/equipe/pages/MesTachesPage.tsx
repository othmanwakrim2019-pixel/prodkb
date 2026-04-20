import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { equipeService } from '../api/equipe.service';
import type { OperationalTask } from '../api/equipe.service';
import { MyTasksBoard } from '../components/MyTasksBoard';

type View = 'today' | 'week';

export default function MesTachesPage() {
    const { user } = useAuth();
    const [view,    setView]    = useState<View>('today');
    const [tasks,   setTasks]   = useState<OperationalTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = view === 'today'
                ? await equipeService.getMyTasksToday()
                : await equipeService.getMyTasksWeek();
            setTasks(data);
        } catch {
            setError('Impossible de charger vos tâches.');
        } finally {
            setLoading(false);
        }
    }, [view]);

    useEffect(() => { load(); }, [load]);

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <ClipboardList size={22} className="text-primary" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes Tâches</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Bonjour {user?.name} — {today}
                        </p>
                    </div>
                </div>
                <button
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                    onClick={load}
                    title="Actualiser"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        view === 'today'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    onClick={() => setView('today')}
                >
                    Aujourd'hui
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        view === 'week'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    onClick={() => setView('week')}
                >
                    Cette semaine
                </button>
            </div>

            {loading && <div className="ent-card p-8 text-center text-sm text-slate-400">Chargement...</div>}
            {error   && <div className="ent-card p-4 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
            {!loading && !error && (
                <MyTasksBoard
                    tasks={tasks}
                    onRefresh={load}
                />
            )}
        </div>
    );
}
