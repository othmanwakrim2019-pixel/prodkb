import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Edit, Plus, RefreshCw, Save, Shield, Trash2, Users } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { CanAccess } from '../../../components/CanAccess';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { roleService } from '../api/admin.service';

interface Permission {
    id: string;
    code: string;
    description: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    _count?: { users: number };
}

interface EditorState {
    id?: string;
    name: string;
    description: string;
    permissions: Set<string>;
    originalName: string;
    originalDescription: string;
    originalPermissions: Set<string>;
    userCount: number;
    isNew: boolean;
    isEditingDetails: boolean;
    isProtected: boolean;
}

const ACTIONS = new Set(['READ', 'WRITE', 'DELETE', 'VIEW', 'CREATE', 'EDIT', 'MANAGE', 'EXPORT']);

const getGroupKey = (code: string) => {
    if (code.includes(':')) return code.split(':')[0];
    const parts = code.split('_');
    return parts.length > 1 && ACTIONS.has(parts[parts.length - 1]) ? parts.slice(0, -1).join('_') : parts[0];
};

const getActionLabel = (code: string) => {
    if (code.includes(':')) return code.split(':').slice(1).join(':');
    const size = getGroupKey(code).split('_').length;
    return code.split('_').slice(size).join('_').toLowerCase() || code.toLowerCase();
};

const equalSets = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((value) => b.has(value));

const ACCESS_PREVIEW = [
    { label: 'Dashboard', permissions: ['DASHBOARD_VIEW'] },
    { label: 'Incidents', permissions: ['INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'INCIDENT_DELETE'] },
    { label: 'Procedures', permissions: ['PROCEDURE_VIEW', 'PROCEDURE_CREATE', 'PROCEDURE_EDIT', 'PROCEDURE_DELETE'] },
    { label: 'Planning', permissions: ['PLANNING_VIEW', 'PLANNING_MANAGE'] },
    { label: 'Equipe / Astreinte', permissions: ['EQUIPE_VIEW', 'EQUIPE_MANAGE', 'MES_TACHES_VIEW'] },
    { label: 'Admin setup', permissions: ['USER_MANAGE', 'ROLE_MANAGE', 'SYSTEM_MANAGE', 'TEAM_MANAGE', 'SLA_MANAGE'] },
    { label: 'Automation', permissions: ['ESCALATION_MANAGE', 'AUTO_ASSIGN_MANAGE', 'WEBHOOK_MANAGE'] },
    { label: 'Audit', permissions: ['AUDIT_VIEW', 'CONFIG_MANAGE', 'EMAIL_TEMPLATE_MANAGE'] },
];

const makeEditor = (role: Partial<Role> & { permissions?: Permission[]; _count?: { users: number } }, options?: Partial<EditorState>): EditorState => ({
    id: role.id,
    name: role.name || '',
    description: role.description || '',
    permissions: new Set((role.permissions || []).map((permission) => permission.id)),
    originalName: role.name || '',
    originalDescription: role.description || '',
    originalPermissions: new Set((role.permissions || []).map((permission) => permission.id)),
    userCount: role._count?.users || 0,
    isNew: false,
    isEditingDetails: false,
    isProtected: role.name === 'ADMIN',
    ...options,
});

export const RoleManagerPage = () => {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [bootLoading, setBootLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [editor, setEditor] = useState<EditorState | null>(null);
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleError, setRoleError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchRole = async (roleId: string) => roleService.getById(roleId);

    const fetchData = async () => {
        setListError(null);
        try {
            const [nextRoles, nextPermissions] = await Promise.all([roleService.getAll(), roleService.getPermissions()]);
            setRoles(nextRoles);
            setAllPermissions(nextPermissions);
        } catch (error) {
            console.error('Failed to fetch roles/permissions:', error);
            setListError('Failed to load roles and permissions.');
        } finally {
            setBootLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const groups = useMemo(() => {
        const grouped = new Map<string, Permission[]>();
        for (const permission of allPermissions) {
            const key = getGroupKey(permission.code);
            const current = grouped.get(key) || [];
            current.push(permission);
            grouped.set(key, current);
        }
        return [...grouped.entries()]
            .map(([key, permissions]) => ({
                key,
                title: key.replace(/_/g, ' ').toUpperCase(),
                permissions: [...permissions].sort((a, b) => a.code.localeCompare(b.code)),
            }))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [allPermissions]);

    const dirty = useMemo(() => !!editor && (
        editor.name !== editor.originalName
        || editor.description !== editor.originalDescription
        || !equalSets(editor.permissions, editor.originalPermissions)
    ), [editor]);

    const selectedPermissionCodes = useMemo(() => {
        if (!editor) return new Set<string>();
        return new Set(allPermissions
            .filter((permission) => editor.permissions.has(permission.id))
            .map((permission) => permission.code));
    }, [allPermissions, editor]);

    const saveDisabled = !editor
        || editor.isProtected
        || saving
        || !dirty
        || !editor.name.trim()
        || editor.permissions.size === 0;

    const confirmDiscard = async () => !dirty || await confirm(
        'Discard unsaved changes?',
        'You have unsaved changes. Discard and switch role?',
        'default',
    );

    const loadRole = async (role: Role, startEditingDetails = false) => {
        if (!await confirmDiscard()) return;
        setSelectedRoleId(role.id);
        setRoleError(null);
        setRoleLoading(true);
        try {
            const freshRole = await fetchRole(role.id);
            setEditor(makeEditor({ ...freshRole, _count: role._count }, { isEditingDetails: startEditingDetails }));
        } catch (error) {
            console.error('Failed to load role:', error);
            setEditor(null);
            setRoleError('Failed to load this role. Please try again.');
        } finally {
            setRoleLoading(false);
        }
    };

    const createRole = async () => {
        if (!await confirmDiscard()) return;
        setSelectedRoleId('new');
        setRoleError(null);
        setEditor(makeEditor({ name: '', description: '', permissions: [], _count: { users: 0 } }, { isNew: true, isEditingDetails: true }));
    };

    const updateEditor = (callback: (current: EditorState) => EditorState) => setEditor((current) => current ? callback(current) : current);

    const togglePermission = (permissionId: string) => updateEditor((current) => {
        const next = new Set(current.permissions);
        if (next.has(permissionId)) next.delete(permissionId);
        else next.add(permissionId);
        return { ...current, permissions: next };
    });

    const toggleGroup = (permissionIds: string[]) => updateEditor((current) => {
        const next = new Set(current.permissions);
        const everySelected = permissionIds.every((permissionId) => next.has(permissionId));
        permissionIds.forEach((permissionId) => everySelected ? next.delete(permissionId) : next.add(permissionId));
        return { ...current, permissions: next };
    });

    const handleSave = async () => {
        if (!editor || saveDisabled) return;
        setSaving(true);
        try {
            const permissionIds = [...editor.permissions];
            if (editor.isNew) {
                await roleService.create({ name: editor.name, description: editor.description, permissionIds });
                await fetchData();
                const refreshedRoles = await roleService.getAll();
                setRoles(refreshedRoles);
                const created = refreshedRoles.find((role: Role) => role.name === editor.name);
                if (created) await loadRole(created);
                toast.success('Role created successfully');
            } else if (editor.id) {
                await roleService.update(editor.id, { name: editor.name, description: editor.description, permissionIds });
                await roleService.replacePermissions(editor.id, permissionIds);
                const freshRole = await fetchRole(editor.id);
                setRoles((current) => current.map((role) => role.id === editor.id ? { ...role, ...freshRole, _count: role._count } : role));
                const currentRole = roles.find((role) => role.id === editor.id);
                setEditor(makeEditor({ ...freshRole, _count: currentRole?._count }));
                toast.success('Role updated successfully');
            }
        } catch (error) {
            console.error('Failed to save role:', error);
            toast.error('Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (role: Role) => {
        if (!await confirm('Delete role?', 'This will remove the role from all users. This action cannot be undone.', 'danger')) return;
        try {
            await roleService.delete(role.id);
            setRoles((current) => current.filter((item) => item.id !== role.id));
            if (selectedRoleId === role.id) {
                setSelectedRoleId(null);
                setEditor(null);
                setRoleError(null);
            }
            toast.success('Role deleted successfully');
        } catch (error) {
            console.error('Failed to delete role:', error);
            toast.error('Failed to delete role');
        }
    };

    const retryRole = async () => {
        const role = roles.find((item) => item.id === selectedRoleId);
        if (role) await loadRole(role);
    };

    if (bootLoading) {
        return (
            <div className="grid gap-6 lg:grid-cols-[minmax(280px,30%)_minmax(0,70%)]">
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
                    {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
                <div className="min-h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
            </div>
        );
    }

    if (listError) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Roles panel unavailable</h2>
                <p className="mt-2 text-sm text-slate-600">{listError}</p>
                <button onClick={fetchData} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Role Management</h1>
                    <p className="mt-1 text-sm text-slate-500">Select a role, then manage its permissions by resource.</p>
                </div>
                <CanAccess permission="ROLE_MANAGE">
                    <button onClick={createRole} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                        <Plus className="h-4 w-4" />
                        Create New Role
                    </button>
                </CanAccess>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(280px,30%)_minmax(0,70%)]">
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <h2 className="text-lg font-bold text-slate-900">Roles</h2>
                        <p className="mt-1 text-sm text-slate-500">All roles, assignment counts, and quick actions.</p>
                    </div>
                    <div className="space-y-3 p-4">
                        {roles.map((role) => {
                            const selected = selectedRoleId === role.id;
                            return (
                                <div
                                    key={role.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => loadRole(role)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            loadRole(role);
                                        }
                                    }}
                                    className={`w-full rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`rounded-full p-2 ${selected ? 'bg-primary/10 text-primary' : 'bg-white text-slate-500'}`}>
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-base font-bold text-slate-900">{role.name}</p>
                                                    <p className="truncate text-sm text-slate-500">{role.description || 'No description provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className={`h-5 w-5 flex-shrink-0 ${selected ? 'text-primary' : 'text-slate-300'}`} />
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">{role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}</span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                            {role._count?.users || 0} user{(role._count?.users || 0) === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {role.name === 'ADMIN' ? (
                                            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">System Protected</span>
                                        ) : (
                                            <>
                                                <CanAccess permission="ROLE_MANAGE">
                                                    <button onClick={(event) => { event.stopPropagation(); loadRole(role, true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                                        <Edit className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                </CanAccess>
                                                <CanAccess permission="ROLE_MANAGE">
                                                    <button onClick={(event) => { event.stopPropagation(); handleDelete(role); }} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </CanAccess>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="min-w-0">
                    {roleLoading ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Loading role permissions...</p>
                                <p className="text-sm text-slate-500">Fetching the latest assignments for this role.</p>
                            </div>
                        </div>
                    ) : roleError ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center">
                            <p className="text-base font-semibold text-slate-900">Couldn&apos;t load this role</p>
                            <p className="text-sm text-slate-600">{roleError}</p>
                            <button onClick={retryRole} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    ) : !editor ? (
                        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
                            <p className="text-lg font-medium text-slate-500">&larr; Select a role to manage its permissions</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-6 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Permissions</p>
                                        <h2 className="text-2xl font-bold text-slate-900">Permissions for: {editor.name || 'New Role'}</h2>
                                        {editor.isEditingDetails ? (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <label className="space-y-1">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role Name</span>
                                                    <input value={editor.name} onChange={(event) => updateEditor((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="e.g. Manager" disabled={editor.isProtected} />
                                                </label>
                                                <label className="space-y-1 md:col-span-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
                                                    <textarea value={editor.description} onChange={(event) => updateEditor((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Describe this role." disabled={editor.isProtected} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-sm text-slate-600">{editor.description || 'No description provided for this role yet.'}</p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{editor.permissions.size} permission{editor.permissions.size === 1 ? '' : 's'}</span>
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{editor.userCount} user{editor.userCount === 1 ? '' : 's'}</span>
                                                    {editor.isProtected && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">System Protected</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!editor.isProtected && !editor.isNew && (
                                        <CanAccess permission="ROLE_MANAGE">
                                            <button onClick={() => updateEditor((current) => ({ ...current, isEditingDetails: !current.isEditingDetails }))} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                                <Edit className="h-4 w-4" />
                                                {editor.isEditingDetails ? 'Done Editing Details' : 'Edit Role Details'}
                                            </button>
                                        </CanAccess>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-5 px-6 py-6">
                                <section className="rounded-xl border border-slate-200 bg-white">
                                    <div className="border-b border-slate-200 px-4 py-3">
                                        <h3 className="text-base font-bold text-slate-900">Access Preview</h3>
                                        <p className="text-xs text-slate-500">A quick matrix for debugging what this role can see or do.</p>
                                    </div>
                                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                                        {ACCESS_PREVIEW.map((item) => {
                                            const granted = item.permissions.filter((permission) => selectedPermissionCodes.has(permission));
                                            const full = granted.length === item.permissions.length;
                                            const partial = granted.length > 0 && !full;
                                            return (
                                                <div key={item.label} className={`rounded-lg border p-3 ${full ? 'border-emerald-200 bg-emerald-50' : partial ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${full ? 'bg-emerald-100 text-emerald-700' : partial ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                                            {full ? 'Full' : partial ? 'Partial' : 'None'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-xs text-slate-500">{granted.length}/{item.permissions.length} permissions granted</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                                        To test a role, assign it to a user in the Users tab, then sign in as that user.
                                    </div>
                                </section>
                                {groups.map((group) => {
                                    const ids = group.permissions.map((permission) => permission.id);
                                    const allSelected = ids.every((id) => editor.permissions.has(id));
                                    const someSelected = ids.some((id) => editor.permissions.has(id));
                                    return (
                                        <section key={group.key} className="rounded-xl border border-slate-200 bg-slate-50/70">
                                            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <h3 className="text-base font-bold tracking-wide text-slate-900">{group.title}</h3>
                                                    <p className="text-xs text-slate-500">{ids.filter((id) => editor.permissions.has(id)).length}/{ids.length} selected</p>
                                                </div>
                                                <button onClick={() => toggleGroup(ids)} disabled={editor.isProtected} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${allSelected ? 'border-primary/20 bg-primary/10 text-primary' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${allSelected ? 'border-primary bg-primary text-white' : someSelected ? 'border-primary/70 bg-primary/10 text-primary' : 'border-slate-300 bg-white text-transparent'}`}>
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                    {allSelected ? 'Clear All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                                                {group.permissions.map((permission) => {
                                                    const checked = editor.permissions.has(permission.id);
                                                    return (
                                                        <label key={permission.id} className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${checked ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'} ${editor.isProtected ? 'cursor-not-allowed opacity-80' : ''}`} title={permission.code}>
                                                            <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.id)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30" disabled={editor.isProtected} />
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-semibold text-slate-800">{getActionLabel(permission.code).replace(/_/g, ' ')}</div>
                                                                <div className="truncate text-xs text-slate-500">{permission.code}</div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-slate-500">{dirty ? 'You have unsaved changes.' : 'No unsaved changes.'}</div>
                                <CanAccess permission="ROLE_MANAGE">
                                    <button onClick={handleSave} disabled={saveDisabled} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                                        <Save className="h-4 w-4" />
                                        {saving ? 'Saving...' : editor.isNew ? 'Create Role' : 'Save Changes'}
                                    </button>
                                </CanAccess>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
