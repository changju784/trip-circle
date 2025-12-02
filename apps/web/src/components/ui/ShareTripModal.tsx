import React, { useState } from "react";
import Modal from "./Modal";

type ShareTripModalProps = {
    open: boolean;
    onClose: () => void;
    onShare: (email: string, role: "editor" | "reader") => void;
};

export default function ShareTripModal({ open, onClose, onShare }: ShareTripModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"editor" | "reader">("editor");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        await new Promise((res) => setTimeout(res, 300)); // simulated async
        onShare(email.trim(), role);
        setEmail("");
        setRole("editor");
        setLoading(false);
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Share Trip">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="someone@example.com"
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                        required
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as "editor" | "reader")}
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                    >
                        <option value="editor">Editor (can edit trip)</option>
                        <option value="reader">Viewer (can only view)</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded border"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                        {loading ? "Inviting..." : "Invite"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
