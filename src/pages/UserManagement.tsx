import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { User, PagePermissions } from '../services/mockData';

const formatUserHandle = (user: User): string => {
  if (user.email && user.email.endsWith('@opsportal.com')) {
    const handle = user.email.replace('@opsportal.com', '');
    return `@${handle}`;
  }
  if (user.email && user.email.includes('@')) {
    return user.email;
  }
  return `@${user.id}`;
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<PagePermissions>({
    production: 'read',
    delivery: 'read',
    leave: 'read',
    status: 'read'
  });
  const loadUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    await authService.updateUserStatus(userId, 'approved');
    await loadUsers();
  };

  const handleDeny = async (userId: string) => {
    await authService.updateUserStatus(userId, 'rejected');
    await loadUsers();
  };

  const handleOpenPermissionsModal = (user: User) => {
    setEditingPermissionsUser(user);
    setTempPermissions(user.permissions || {
      production: 'read',
      delivery: 'read',
      leave: 'read',
      status: 'read'
    });
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermissionsUser) return;
    await authService.updateUserPermissions(editingPermissionsUser.id, tempPermissions);
    setEditingPermissionsUser(null);
    await loadUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    await authService.deleteUser(deleteConfirmUser.id);
    setDeleteConfirmUser(null);
    await loadUsers();
  };

  const pendingUsers = users.filter(u => u.status === 'pending' && u.role !== 'admin');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <nav className="flex text-[10px] font-mono text-on-surface-variant/70 mb-2 gap-2 uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer">Admin</span>
            <span>/</span>
            <span className="text-primary font-bold">User Access & Permissions</span>
          </nav>
          <h2 className="font-display-lg text-2xl font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
            Super Admin Control Center
          </h2>
          <p className="text-on-surface-variant/80 text-xs max-w-xl">
            Approve new registration requests, configure per-page Read/Write permissions, or revoke user access.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh Users
        </button>
      </div>

      {/* Pending Access Requests Alert */}
      {pendingUsers.length > 0 && (
        <div className="glass-panel inner-glow p-6 rounded-2xl border-l-4 border-l-amber-500 shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-2xl">how_to_reg</span>
              <div>
                <h3 className="font-headline-sm font-bold text-sm text-on-surface">
                  Pending Access Requests ({pendingUsers.length})
                </h3>
                <p className="text-on-surface-variant/70 text-xs">Review and grant or deny access to new user signups</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((pUser) => (
              <div key={pUser.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-on-surface flex items-center gap-2">
                    <span>{pUser.name}</span>
                    <span className="bg-amber-500/20 text-amber-400 font-mono text-[9px] px-2 py-0.5 rounded uppercase">Pending</span>
                  </div>
                  <div className="text-[11px] font-mono text-on-surface-variant/70">{formatUserHandle(pUser)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(pUser.id)}
                    className="bg-primary text-on-primary font-bold px-3 py-1.5 rounded-lg text-xs hover:opacity-90 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Allow
                  </button>
                  <button
                    onClick={() => handleDeny(pUser.id)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer border border-red-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main User Directory Table */}
      <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">group</span>
            User Directory & Granular Permissions
          </h3>
          <span className="bg-primary-container/20 text-primary font-mono text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
            {users.length} Registered Account{users.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider bg-white/5">
                <th className="p-3.5 font-semibold">User</th>
                <th className="p-3.5 font-semibold">Role</th>
                <th className="p-3.5 font-semibold">Access Status</th>
                <th className="p-3.5 font-semibold">Page Permissions (Branch / Delivery / Leave / Status)</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {users.map((u) => {
                const isSuperAdmin = u.role === 'admin';
                const perms = u.permissions || { production: 'read', delivery: 'read', leave: 'read', status: 'read' };

                return (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-body">
                      <div className="font-bold text-on-surface text-xs">{u.name}</div>
                      <div className="text-[10px] text-on-surface-variant/70 font-mono">{formatUserHandle(u)}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSuperAdmin ? 'bg-primary-container/30 text-primary border border-primary/40' : 'bg-white/10 text-on-surface-variant'
                      }`}>
                        {isSuperAdmin ? 'Super Admin' : 'User'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'approved' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : u.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {(u.status || 'approved').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${perms.production === 'write' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-on-surface-variant/70'}`}>
                          Branch: {perms.production.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${perms.delivery === 'write' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-on-surface-variant/70'}`}>
                          Delivery: {perms.delivery.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${perms.leave === 'write' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-on-surface-variant/70'}`}>
                          Leave: {perms.leave.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${perms.status === 'write' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-on-surface-variant/70'}`}>
                          Status: {perms.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-body">
                      {!isSuperAdmin ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenPermissionsModal(u)}
                            className="text-primary hover:bg-primary/10 px-2.5 py-1 rounded transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">tune</span>
                            Permissions
                          </button>
                          {u.status === 'approved' ? (
                            <button
                              onClick={() => handleDeny(u.id)}
                              className="text-amber-400 hover:bg-amber-500/10 px-2.5 py-1 rounded transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">block</span>
                              Deny Access
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="text-emerald-400 hover:bg-emerald-500/10 px-2.5 py-1 rounded transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Allow Access
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="text-red-400 hover:bg-red-500/10 px-2.5 py-1 rounded transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-on-surface-variant/50 italic">Super Admin (Root)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Permissions Modal */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSavePermissions} className="glass-panel inner-glow w-full max-w-md rounded-2xl p-6 relative space-y-4">
            <button 
              type="button"
              onClick={() => setEditingPermissionsUser(null)}
              className="absolute top-4 right-4 text-on-surface-variant/80 hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                Configure Page Permissions
              </h3>
              <p className="text-xs text-on-surface-variant/70 font-mono">User: {editingPermissionsUser.name} ({editingPermissionsUser.email})</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs">Live Branch Details</div>
                  <div className="text-[10px] text-on-surface-variant/70">Register and update production branch releases</div>
                </div>
                <select
                  value={tempPermissions.production}
                  onChange={(e) => setTempPermissions({ ...tempPermissions, production: e.target.value as 'read' | 'write' })}
                  className="bg-surface-container-low border border-white/10 rounded px-2.5 py-1 text-xs font-mono font-bold"
                >
                  <option value="read">Read Only</option>
                  <option value="write">Read & Write</option>
                </select>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs">Delivery Tracker</div>
                  <div className="text-[10px] text-on-surface-variant/70">Add and modify deliverables and tasks</div>
                </div>
                <select
                  value={tempPermissions.delivery}
                  onChange={(e) => setTempPermissions({ ...tempPermissions, delivery: e.target.value as 'read' | 'write' })}
                  className="bg-surface-container-low border border-white/10 rounded px-2.5 py-1 text-xs font-mono font-bold"
                >
                  <option value="read">Read Only</option>
                  <option value="write">Read & Write</option>
                </select>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs">Leave Tracker</div>
                  <div className="text-[10px] text-on-surface-variant/70">Book and update team resource leave schedules</div>
                </div>
                <select
                  value={tempPermissions.leave}
                  onChange={(e) => setTempPermissions({ ...tempPermissions, leave: e.target.value as 'read' | 'write' })}
                  className="bg-surface-container-low border border-white/10 rounded px-2.5 py-1 text-xs font-mono font-bold"
                >
                  <option value="read">Read Only</option>
                  <option value="write">Read & Write</option>
                </select>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs">Daily Team Status</div>
                  <div className="text-[10px] text-on-surface-variant/70">Post and update daily focus logs</div>
                </div>
                <select
                  value={tempPermissions.status}
                  onChange={(e) => setTempPermissions({ ...tempPermissions, status: e.target.value as 'read' | 'write' })}
                  className="bg-surface-container-low border border-white/10 rounded px-2.5 py-1 text-xs font-mono font-bold"
                >
                  <option value="read">Read Only</option>
                  <option value="write">Read & Write</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingPermissionsUser(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-on-surface font-semibold py-2 rounded-xl text-xs border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-on-primary font-bold py-2 rounded-xl text-xs shadow-lg shadow-primary/10"
              >
                Save Permissions
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel inner-glow w-full max-w-sm rounded-2xl p-6 relative space-y-4">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined">delete_forever</span>
              Delete User Account
            </h3>
            <p className="text-xs text-on-surface-variant/80">
              Are you sure you want to permanently delete user <strong className="text-on-surface">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})? This action cannot be undone.
            </p>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-on-surface font-semibold py-2 rounded-xl text-xs border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs shadow-lg shadow-red-500/20"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagement;
