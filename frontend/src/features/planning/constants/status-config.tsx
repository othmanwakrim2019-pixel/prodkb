import React from 'react';
import { Clock, Play, CheckCircle, XCircle, Ban } from 'lucide-react';
import type { PlanningStatusType } from '../model/planning';

export const STATUS_CONFIG: Record<PlanningStatusType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: 'En attente', color: 'text-slate-600', bg: 'bg-slate-100', icon: <Clock className="h-3.5 w-3.5" /> },
    running: { label: 'En cours', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Play className="h-3.5 w-3.5 animate-pulse" /> },
    done: { label: 'Termine', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    failed: { label: 'Echoue', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="h-3.5 w-3.5" /> },
    blocked: { label: 'Bloque', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Ban className="h-3.5 w-3.5" /> },
};
