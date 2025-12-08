import React, { useMemo, useState } from "react";
// Ensure this imports the correct wrapper (named export vs default export)
import { Modal } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useUsers } from "@/lib/users/use-users";
import debounce from "lodash.debounce";

type ShareTripModalProps = {
    open: boolean;
    onClose: () => void;
    onShare: (email: string) => Promise<void>;
};


export default function ShareTripModal({ open, onClose, onShare }: ShareTripModalProps) {
    const [selectedUser, setSelectedUser] = useState<{ id: string; label: string; email: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const { searchUsers } = useUsers();

    const fetchOptions = useMemo(() => {
        const debouncedSearch = debounce(async (query: string, callback: (results: any[]) => void) => {
            const users = await searchUsers(query);
            callback(
                users.map((u) => ({
                    id: u.id!,
                    label: `${u.username} (${u.email})`,
                    email: u.email,
                }))
            );
        }, 300);

        return (query: string) =>
            new Promise<any[]>((resolve) => {
                debouncedSearch(query, resolve);
            });
    }, [searchUsers]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setLoading(true);

        await onShare(selectedUser.email);

        setLoading(false);
        setSelectedUser(null);
        onClose();
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title="Share Trip"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Invite User</label>
                    <Select
                        placeholder="Search by username or email"
                        value={selectedUser}
                        onChange={(val) => setSelectedUser(val as any)}
                        fetchOptions={fetchOptions}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading || !selectedUser}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {loading ? "Sharing..." : "Share"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}