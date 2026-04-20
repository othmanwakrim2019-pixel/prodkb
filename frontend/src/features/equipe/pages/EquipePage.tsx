import { useState, useEffect, useCallback } from 'react';
import { Users2, CalendarClock, List, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { teamService, systemService, userService } from '../../admin/api/admin.service';
import type { Team, System } from '../../../types';
import { equipeService } from '../api/equipe.service';
import { astreinteService } from '../api/astreinte.service';
import type { DailyPlan } from '../api/equipe.service';
import type { Astreinte } from '../api/astreinte.service';
import { DailyBoard } from '../components/DailyBoard';
import { WeekGrid } from '../components/WeekGrid';
import { AstreintePlanning } from '../components/AstreintePlanning';
import { AssignTaskModal } from '../components/AssignTaskModal';

type Tab = 'today' | 'week' | 'astreintes';

interface Member { id: string; name: string; email: string; }

function formatDateTitle(d: Date) {
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getMonday(d: Date) {
    const day = d.getDay() || 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day - 1));
    mon.setHours(0, 0, 0, 0);
    return mon;
}

export default function EquipePage() {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('EQUIPE_MANAGE');

    const [tab,        setTab]       = useState<Tab>('today');
    const [today,      setToday]     = useState(new Date());
    const [weekStart,  setWeekStart] = useState(getMonday(new Date()));
    const [astrYear,   setAstrYear]  = useState(new Date().getFullYear());

    // Data
    const [teams,      setTeams]     = useState<Team[]>([]);
    const [systems,    setSystems]   = useState<System[]>([]);
    const [members,    setMembers]   = useState<Member[]>([]);
    const [dayPlan,    setDayPlan]   = useState<DailyPlan | null>(null);
    const [weekPlans,  setWeekPlans] = useState<DailyPlan[]>([]);
    const [astreintes, setAstreintes]= useState<Astreinte[]>([]);

    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [loading,        setLoading]         = useState(false);

    // Week-grid quick-assign modal
    const [quickAssign, setQuickAssign] = useState<{ planId: string; memberId: string } | null>(null);

    // Load reference data once
    useEffect(() => {
        Promise.all([teamService.getAll(), systemService.getAll(), userService.getAll()])
            .then(([t, s, u]) => {
                setTeams(t);
                setSystems(s);
                setMembers(u.map((user: { id: string; name: string; email: string }) => ({
                    id: user.id, name: user.name, email: user.email,
                })));
                if (t.length > 0 && !selectedTeamId) setSelectedTeamId(t[0].id);
            })
            .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load team members when team changes
    useEffect(() => {
        if (!selectedTeamId) return;
        const team = teams.find((t) => t.id === selectedTeamId) as (Team & { members?: { user: { id: string; name: string; email: string } }[] }) | undefined;
        if (team?.members) {
            setMembers(team.members.map((m) => m.user));
        }
    }, [selectedTeamId, teams]);

    const loadDayPlan = useCallback(async () => {
        if (!selectedTeamId) return;
        setLoading(true);
        try {
            const plan = await equipeService.getDayPlan(today.toISOString(), selectedTeamId);
            setDayPlan(plan);
        } catch { setDayPlan(null); }
        finally { setLoading(false); }
    }, [today, selectedTeamId]);

    const loadWeekPlans = useCallback(async () => {
        if (!selectedTeamId) return;
        setLoading(true);
        try {
            const plans = await equipeService.getWeekPlans(weekStart.toISOString(), selectedTeamId);
            setWeekPlans(plans);
        } catch { setWeekPlans([]); }
        finally { setLoading(false); }
    }, [weekStart, selectedTeamId]);

    const loadAstreintes = useCallback(async () => {
        if (!selectedTeamId) return;
        setLoading(true);
        try {
            const list = await astreinteService.getAll(astrYear, selectedTeamId);
            setAstreintes(list);
        } catch { setAstreintes([]); }
        finally { setLoading(false); }
    }, [astrYear, selectedTeamId]);

    useEffect(() => { if (tab === 'today')      loadDayPlan();    }, [tab, loadDayPlan]);
    useEffect(() => { if (tab === 'week')        loadWeekPlans();  }, [tab, loadWeekPlans]);
    useEffect(() => { if (tab === 'astreintes')  loadAstreintes(); }, [tab, loadAstreintes]);

    const handleCreatePlan = async () => {
        if (!selectedTeamId) return;
        const newPlan = await equipeService.createPlan({
            teamId:    selectedTeamId,
            date:      today.toISOString(),
            isWeekend: [0, 6].includes(today.getDay()),
        });
        setDayPlan(newPlan);
    };

    const handleWeekCellClick = async (date: Date, member: { id: string }) => {
        if (!canManage || !selectedTeamId) return;
        // Find or create the plan for that day
        let plan = weekPlans.find((p) => p.date.startsWith(date.toISOString().split('T')[0]));
        if (!plan) {
            plan = await equipeService.createPlan({
                teamId:    selectedTeamId,
                date:      date.toISOString(),
                isWeekend: [0, 6].includes(date.getDay()),
            });
            setWeekPlans((prev) => [...prev, plan!]);
        }
        setQuickAssign({ planId: plan.id, memberId: member.id });
    };

    const navigateDay = (delta: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() + delta);
        setToday(d);
    };

    const navigateWeek = (delta: number) => {
        const w = new Date(weekStart);
        w.setDate(w.getDate() + delta * 7);
        setWeekStart(w);
    };

    const selectedTeam = teams.find((t) => t.id === selectedTeamId);
    const teamMembers  = (selectedTeam as (Team & { members?: { user: Member }[] }) | undefined)?.members?.map((m) => m.user) ?? members;

    return (
        <div className="space-y-4">
            {/* Page header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Users2 size={22} className="text-primary" />
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Gestion Équipe</h1>
                </div>

                {/* Team selector */}
                {teams.length > 1 && (
                    <select
                        className="ent-input text-sm"
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                )}
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                {(['today', 'week', 'astreintes'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            tab === t
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {t === 'today'      && <><List size={15} /> Aujourd'hui</>}
                        {t === 'week'       && <><CalendarClock size={15} /> Cette semaine</>}
                        {t === 'astreintes' && <>📞 Astreintes</>}
                    </button>
                ))}
            </div>

            {/* ── TODAY tab ─────────────────────────────────── */}
            {tab === 'today' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => navigateDay(-1)}><ChevronLeft size={18} /></button>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{formatDateTitle(today)}</span>
                        <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => navigateDay(1)}><ChevronRight size={18} /></button>
                        {canManage && !dayPlan && (
                            <button className="ent-btn-primary ml-auto" onClick={handleCreatePlan}>
                                <Plus size={14} /> Créer le plan du jour
                            </button>
                        )}
                    </div>
                    {loading ? <div className="ent-card p-8 text-center text-sm text-slate-400">Chargement...</div> : (
                        <DailyBoard
                            plan={dayPlan}
                            members={teamMembers}
                            systems={systems.map((s) => ({ id: s.id, name: s.name }))}
                            canManage={canManage}
                            onPlanChange={loadDayPlan}
                        />
                    )}
                </div>
            )}

            {/* ── WEEK tab ──────────────────────────────────── */}
            {tab === 'week' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => navigateWeek(-1)}><ChevronLeft size={18} /></button>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => navigateWeek(1)}><ChevronRight size={18} /></button>
                    </div>
                    {loading ? <div className="ent-card p-8 text-center text-sm text-slate-400">Chargement...</div> : (
                        <WeekGrid
                            weekPlans={weekPlans}
                            members={teamMembers}
                            onCellClick={handleWeekCellClick}
                        />
                    )}
                </div>
            )}

            {/* ── ASTREINTES tab ─────────────────────────────── */}
            {tab === 'astreintes' && (
                <div>
                    {loading ? <div className="ent-card p-8 text-center text-sm text-slate-400">Chargement...</div> : (
                        <AstreintePlanning
                            astreintes={astreintes}
                            teams={teams.map((t) => ({ id: t.id, name: t.name }))}
                            members={teamMembers}
                            canManage={canManage}
                            year={astrYear}
                            onYearChange={setAstrYear}
                            onRefresh={loadAstreintes}
                        />
                    )}
                </div>
            )}

            {/* Quick-assign modal from WeekGrid cell click */}
            {quickAssign && (
                <AssignTaskModal
                    planId={quickAssign.planId}
                    members={teamMembers}
                    systems={systems.map((s) => ({ id: s.id, name: s.name }))}
                    preAssignedTo={quickAssign.memberId}
                    onClose={() => setQuickAssign(null)}
                    onSaved={() => { setQuickAssign(null); loadWeekPlans(); }}
                />
            )}
        </div>
    );
}
