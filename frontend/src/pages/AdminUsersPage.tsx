import { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import type { User } from '@/types';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@platevision.local',
      role: 'ADMIN',
      is_active: true,
      created_at: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr_operator',
      username: 'toll_operator_01',
      email: 'operator1@platevision.local',
      role: 'OPERATOR',
      is_active: true,
      created_at: '2026-09-05T10:30:00Z',
    },
    {
      id: 'usr_inspector',
      username: 'traffic_police_inq',
      email: 'inquiry@traffic.gov.in',
      role: 'VIEWER',
      is_active: true,
      created_at: '2026-09-10T14:15:00Z',
    },
  ]);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) {
      setError('All fields are required.');
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: newUsername,
      email: newEmail,
      role: newRole,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    setModalOpen(false);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setError(null);
  };

  const handleDeleteUser = (id: string) => {
    if (id === 'usr_admin') {
      alert('Cannot delete primary administrator account.');
      return;
    }
    if (confirm('Are you sure you want to revoke access for this user?')) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Username',
      accessor: (row: User) => (
        <span className="font-semibold text-text-primary flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-accent" />
          {row.username}
        </span>
      ),
    },
    {
      header: 'Email Address',
      accessor: 'email' as keyof User,
    },
    {
      header: 'Role / Privileges',
      accessor: (row: User) => {
        let variant: 'default' | 'success' | 'info' = 'default';
        if (row.role === 'ADMIN') variant = 'info';
        else if (row.role === 'OPERATOR') variant = 'success';
        return <Badge variant={variant}>{row.role}</Badge>;
      },
    },
    {
      header: 'Created On',
      accessor: (row: User) => (
        <span className="text-xs text-text-muted">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Active'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row: User) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteUser(row.id)}
          className="text-error hover:bg-error-muted"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Access Control & User Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Administer role-based authentication permissions (RBAC) and operator accounts.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Provision New User
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Filter users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <Table
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        emptyMessage="No users found matching search query."
      />

      {/* Provision Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision Operator Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-error-muted border border-error/30 text-error text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-text-muted block mb-1">Username</label>
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. checkpoint_operator_north"
              required
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Email Address</label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="operator@platevision.local"
              required
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Temporary Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">RBAC Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full bg-bg-surface border border-border-default text-text-primary text-xs rounded-lg px-3 py-2 outline-none focus:border-accent"
            >
              <option value="OPERATOR">OPERATOR (Scan, View, Stream)</option>
              <option value="ADMIN">ADMIN (Full Permissions & User Admin)</option>
              <option value="VIEWER">VIEWER (Read-only Audit Log Access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
