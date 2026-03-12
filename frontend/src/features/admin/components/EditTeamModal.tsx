import { useState } from 'react';

import { Team } from '../../../types';

export const EditTeamModal = ({ team, onClose, onSave }: { team: Team; onClose: () => void; onSave: (team: Team) => void }) => {
    const [editingTeam, setEditingTeam] = useState<Team>(team);

    const handleSave = () => {
        onSave(editingTeam);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Team</h3>
                <div className="grid gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                        <input
                            type="text"
                            value={editingTeam.name}
                            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={editingTeam.description || ''}
                            onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}
                            rows={2}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Distribution</label>
                        <input
                            type="text"
                            value={editingTeam.emailDistribution}
                            onChange={(e) => setEditingTeam({ ...editingTeam, emailDistribution: e.target.value })}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder="team@example.com"
                        />
                    </div>
                    <div className="flex items-center mt-2">
                        <input
                            id="sendEmail"
                            type="checkbox"
                            checked={editingTeam.sendEmail !== false} // Default to true if undefined
                            onChange={(e) => setEditingTeam({ ...editingTeam, sendEmail: e.target.checked })}
                            className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                        />
                        <label htmlFor="sendEmail" className="ml-2 block text-sm text-slate-900">
                            Receive Email Notifications
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

