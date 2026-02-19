import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { SLA, Severity } from '../../types';
import { useTranslation } from 'react-i18next';

export const SLAManagement = () => {
    const { canManageSLAs } = useAuth();
    const { t } = useTranslation();
    const [slas, setSlas] = useState<SLA[]>([]);
    const [showSlaForm, setShowSlaForm] = useState(false);
    const [newSla, setNewSla] = useState({ name: '', description: '', severity: 'Medium', acknowledgeTimeMinutes: 60, resolveTimeMinutes: 480 });
    const [editingSla, setEditingSla] = useState<SLA | null>(null);

    useEffect(() => {
        fetchSlas();
    }, []);

    const fetchSlas = async () => {
        try {
            const response = await axios.get('/api/slas');
            setSlas(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch SLAs', error);
        }
    };

    const handleCreateSla = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/slas', newSla);
            setNewSla({ name: '', description: '', severity: 'Medium', acknowledgeTimeMinutes: 60, resolveTimeMinutes: 480 });
            setShowSlaForm(false);
            await fetchSlas();
            alert('SLA created successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to create SLA', error);
            alert(error.response?.data?.error || 'Failed to create SLA');
        }
    };

    const handleUpdateSla = async () => {
        if (!editingSla) return;
        try {
            await axios.put(`/api/slas/${editingSla.id}`, {
                name: editingSla.name,
                description: editingSla.description,
                severity: editingSla.severity,
                acknowledgeTimeMinutes: Number(editingSla.acknowledgeTimeMinutes),
                resolveTimeMinutes: Number(editingSla.resolveTimeMinutes)
            });
            setEditingSla(null);
            await fetchSlas();
            alert('SLA updated successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to update SLA', error);
            alert(error.response?.data?.error || 'Failed to update SLA');
        }
    };

    const handleDeleteSla = async (slaId: string) => {
        if (!confirm('Are you sure you want to delete this SLA policy?')) return;
        try {
            await axios.delete(`/api/slas/${slaId}`);
            await fetchSlas();
            alert('SLA deleted successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to delete SLA', error);
            alert(error.response?.data?.error || 'Failed to delete SLA');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.slas.title')}</h2>
                {canManageSLAs() && (
                    <button
                        onClick={() => setShowSlaForm(!showSlaForm)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('admin.slas.addSla')}
                    </button>
                )}
            </div>

            {showSlaForm && (
                <form onSubmit={handleCreateSla} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-medium text-slate-900">{t('admin.slas.addSla')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Policy Name</label>
                            <input
                                type="text"
                                required
                                value={newSla.name}
                                onChange={(e) => setNewSla({ ...newSla, name: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={newSla.description}
                                onChange={(e) => setNewSla({ ...newSla, description: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Severity Level</label>
                            <select
                                value={newSla.severity}
                                onChange={(e) => setNewSla({ ...newSla, severity: e.target.value as Severity })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ack Time (min)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={newSla.acknowledgeTimeMinutes}
                                    onChange={(e) => setNewSla({ ...newSla, acknowledgeTimeMinutes: parseInt(e.target.value) || 0 })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Resolve Time (min)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={newSla.resolveTimeMinutes}
                                    onChange={(e) => setNewSla({ ...newSla, resolveTimeMinutes: parseInt(e.target.value) || 0 })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowSlaForm(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                        >
                            Create Policy
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ack Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resolve Time</th>
                            {canManageSLAs() && <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {slas.map((sla) => (
                            <tr key={sla.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sla.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                        sla.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                            sla.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {sla.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                    {sla.name}
                                    <div className="text-xs text-slate-500 font-normal">{sla.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{sla.acknowledgeTimeMinutes} min</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{sla.resolveTimeMinutes} min</td>
                                {canManageSLAs() && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setEditingSla(sla)}
                                            className="text-accent hover:text-blue-900 mr-3"
                                            title="Edit SLA"
                                        >
                                            <Pencil className="h-4 w-4 inline" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSla(sla.id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete SLA"
                                        >
                                            <Trash2 className="h-4 w-4 inline" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingSla && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit SLA Policy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Policy Name</label>
                                <input
                                    type="text"
                                    value={editingSla.name}
                                    onChange={(e) => setEditingSla({ ...editingSla, name: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={editingSla.description}
                                    onChange={(e) => setEditingSla({ ...editingSla, description: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Severity Level</label>
                                <select
                                    value={editingSla.severity}
                                    onChange={(e) => setEditingSla({ ...editingSla, severity: e.target.value as Severity })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                >
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ack Time (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editingSla.acknowledgeTimeMinutes}
                                        onChange={(e) => setEditingSla({ ...editingSla, acknowledgeTimeMinutes: parseInt(e.target.value) || 0 })}
                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Resolve Time (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editingSla.resolveTimeMinutes}
                                        onChange={(e) => setEditingSla({ ...editingSla, resolveTimeMinutes: parseInt(e.target.value) || 0 })}
                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingSla(null)}
                                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateSla}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
