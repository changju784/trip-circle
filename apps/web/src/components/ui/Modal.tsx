import React from "react";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
            <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl z-50 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} aria-label="close" className="text-lg">✕</button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}
