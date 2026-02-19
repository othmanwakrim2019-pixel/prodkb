import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { Plus, Check, Shield, Trash2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

// Group permission codes by module category
const PERMISSION_CATEGORIES: Record<string, string[]> = {
    'Core': ['DASHBOARD_VIEW', 'SEARCH_VIEW'],
    'Incidents': ['INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'INCIDENT_DELETE'],
    'Procedures': ['PROCEDURE_VIEW', 'PROCEDURE_CREATE', 'PROCEDURE_EDIT', 'PROCEDURE_DELETE'],
    'Planning': ['PLANNING_VIEW', 'PLANNING_MANAGE'],
    'Analytics': ['ANALYTICS_VIEW'],
    'Users & Roles': ['USER_VIEW', 'USER_MANAGE', 'ROLE_MANAGE'],
    'Teams': ['TEAM_MANAGE', 'TEAM_DELETE'],
    'Systems & Jobs': ['SYSTEM_MANAGE', 'JOB_VIEW', 'JOB_MANAGE'],
    'SLAs & Escalation': ['SLA_MANAGE', 'ESCALATION_MANAGE'],
    'Auto-Assignment': ['AUTO_ASSIGN_MANAGE'],
    'Webhooks': ['WEBHOOK_MANAGE'],
    'Configuration': ['CONFIG_MANAGE', 'EMAIL_TEMPLATE_MANAGE'],
    'Audit': ['AUDIT_VIEW'],
};

export const RoleManager = () => {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create State
    const [isEditing, setIsEditing] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role>>({});
    const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/api/v1/roles'),
                api.get('/api/v1/roles/permissions')
            ]);
            setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.data || []);
            setAllPermissions(Array.isArray(permsRes.data) ? permsRes.data : permsRes.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch roles/permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group permissions by category
    const groupedPermissions = useMemo(() => {
        const permByCode = new Map(allPermissions.map(p => [p.code, p]));
        const grouped: { category: string; perms: Permission[] }[] = [];
        const usedCodes = new Set<string>();

        for (const [category, codes] of Object.entries(PERMISSION_CATEGORIES)) {
            const perms = codes
                .map(code => permByCode.get(code))
                .filter((p): p is Permission => !!p);
            if (perms.length > 0) {
                grouped.push({ category, perms });
                perms.forEach(p => usedCodes.add(p.code));
            }
        }

        // Catch any permissions not mapped to a category (e.g., new ones added after this code)
        const uncategorized = allPermissions.filter(p => !usedCodes.has(p.code));
        if (uncategorized.length > 0) {
            grouped.push({ category: 'Other', perms: uncategorized });
        }

        return grouped;
    }, [allPermissions]);

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setSelectedPerms(new Set(role.permissions.map(p => p.id)));
        setIsEditing(true);
    };

    const handleCreate = () => {
        setEditingRole({ name: '', description: '' });
        setSelectedPerms(new Set());
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: editingRole.name,
                description: editingRole.description,
                permissionIds: Array.from(selectedPerms)
            };

            if (editingRole.id) {
                await api.put(`/api/v1/roles/${editingRole.id}`, payload);
            } else {
                await api.post('/api/v1/roles', payload);
            }

            setIsEditing(false);
            fetchData();
        } catch (error) {
            alert('Failed to save role');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will remove the role from all users.')) return;
        try {
            await api.delete(`/api/v1/roles/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete role');
        }
    };

    const togglePerm = (id: string) => {
        const next = new Set(selectedPerms);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedPerms(next);
    };

    const selectAllInCategory = (perms: Permission[]) => {
        const next = new Set(selectedPerms);
        const allSelected = perms.every(p => next.has(p.id));
        perms.forEach(p => {
            if (allSelected) next.delete(p.id);
            else next.add(p.id);
        });
        setSelectedPerms(next);
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="grid gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-lg border shadow-sm h-48 animate-pulse flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
                                <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                                <div className="flex gap-2 pt-2">
                                    <div className="h-6 w-16 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-16 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-16 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{editingRole.id ? t('admin.roles.editRole') : t('admin.roles.addRole')}</h2>
                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700">{t('common.cancel')}</button>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-lg border shadow-sm">
                    <div>
                        <label className="block text-sm font-medium mb-1">Role Name</label>
                        <input
                            value={editingRole.name || ''}
                            onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                            className="w-full p-2 border rounded-md"
                            placeholder="e.g. DASHBOARD_VIEWER"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                            value={editingRole.description || ''}
                            onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                            className="w-full p-2 border rounded-md"
                            placeholder="Role purpose..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">Permissions</label>
                        <div className="space-y-5">
                            {groupedPermissions.map(({ category, perms }) => {
                                const allSelected = perms.every(p => selectedPerms.has(p.id));
                                const someSelected = perms.some(p => selectedPerms.has(p.id));
                                return (
                                    <div key={category} className="border rounded-lg overflow-hidden">
                                        <div
                                            className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => selectAllInCategory(perms)}
                                        >
                                            <h4 className="font-semibold text-sm text-slate-700">{category}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">
                                                    {perms.filter(p => selectedPerms.has(p.id)).length}/{perms.length}
                                                </span>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? 'bg-blue-600 border-blue-600' :
                                                    someSelected ? 'bg-blue-200 border-blue-400' : 'border-slate-300'
                                                    }`}>
                                                    {allSelected && <Check className="w-3 h-3 text-white" />}
                                                    {someSelected && !allSelected && <div className="w-2 h-0.5 bg-blue-600 rounded" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                                            {perms.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => togglePerm(p.id)}
                                                    className={`p-3 border-b md:border-r last:border-b-0 cursor-pointer flex items-start gap-3 transition-colors ${selectedPerms.has(p.id) ? 'bg-blue-50' : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedPerms.has(p.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                                        }`}>
                                                        {selectedPerms.has(p.id) && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{p.code}</div>
                                                        <div className="text-xs text-slate-500">{p.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={!editingRole.name}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            Save Role
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
                    <p className="text-muted-foreground">Define custom roles and access policies</p>
                </div>
                <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Role
                </button>
            </div>

            <div className="grid gap-6">
                {roles.map(role => (
                    <div key={role.id} className={`bg-white p-6 rounded-lg border shadow-sm flex flex-col md:flex-row gap-6 ${role.name === 'ADMIN' ? 'border-blue-300 bg-blue-50/30' : ''}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className={`w-5 h-5 ${role.name === 'ADMIN' ? 'text-amber-500' : 'text-blue-600'}`} />
                                <h3 className="text-lg font-bold">{role.name}</h3>
                                {role.name === 'ADMIN' && (
                                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                        System Protected
                                    </span>
                                )}
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                    {role.permissions.length} permissions
                                </span>
                            </div>
                            <p className="text-slate-600 text-sm mb-4">{role.description}</p>

                            <div className="flex flex-wrap gap-2">
                                {role.permissions.slice(0, 12).map(p => (
                                    <span key={p.id} className="text-xs bg-slate-50 border px-2 py-1 rounded text-slate-700" title={p.description}>
                                        {p.code}
                                    </span>
                                ))}
                                {role.permissions.length > 12 && (
                                    <span className="text-xs text-slate-500 py-1">+ {role.permissions.length - 12} more</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                            {role.name === 'ADMIN' ? (
                                <span className="text-sm text-slate-400 italic">Read-only</span>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleEdit(role)}
                                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
