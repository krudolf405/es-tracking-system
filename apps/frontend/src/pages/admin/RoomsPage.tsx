import { useEffect, useState, FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

interface Room {
  id: string;
  name: string;
  capacity: string;
  location: string;
  createdAt: string;
  sessionCount: number;
}

interface RoomForm {
  name: string;
  capacity: string;
  location: string;
}

const emptyForm: RoomForm = { name: '', capacity: '', location: '' };

function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get<Room[]>('/rooms');
      setRooms(res.data);
    } catch {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setForm({ name: room.name, capacity: room.capacity, location: room.location });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingRoom) {
        await api.patch(`/rooms/${editingRoom.id}`, form);
        setSuccess('Room updated successfully');
      } else {
        await api.post('/rooms', form);
        setSuccess('Room added successfully');
      }
      setShowModal(false);
      fetchRooms();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRoom) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.delete(`/rooms/${deletingRoom.id}`);
      setSuccess(res.data.message || 'Room deleted successfully');
      setDeletingRoom(null);
      fetchRooms();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to delete room');
      setDeletingRoom(null);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Rooms</h1>
        <button
          onClick={openAddModal}
          className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900"
        >
          + Add Room
        </button>
      </div>

      {success && (
        <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-800">{success}</div>
      )}
      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Room Name</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Exam Sessions</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No rooms yet. Click &quot;+ Add Room&quot; to create one.
                </td>
              </tr>
            )}
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{room.name}</td>
                <td className="px-4 py-3">{room.capacity}</td>
                <td className="px-4 py-3">{room.location}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      room.sessionCount > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {room.sessionCount} session{room.sessionCount === 1 ? '' : 's'}
                  </span>
                </td>
                <td className="px-4 py-3">{formatDate(room.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(room)}
                      className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingRoom(room)}
                      className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {editingRoom ? 'Edit Room' : 'Add Room'}
            </h2>
            {error && (
              <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                placeholder="Room Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
              />
              <input
                placeholder="Capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
              />
              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
              />
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRoom ? 'Save Changes' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Room</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800">&quot;{deletingRoom.name}&quot;</span>?
              This cannot be undone.
            </p>
            {error && (
              <div className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>
            )}
            <div className="mt-5 flex justify-end space-x-3">
              <button
                onClick={() => setDeletingRoom(null)}
                className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default RoomsPage;