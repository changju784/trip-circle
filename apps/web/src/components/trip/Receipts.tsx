import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Receipt, Image, FileText, Upload, Eye, Trash2 } from "lucide-react";

interface ReceiptItem {
    id: string;
    name: string;
    url: string;
    contentType: string;
    size: number;
    uploadedAt: string;
    dayDate?: string;
}

interface ReceiptsProps {
    tripId: string;
    receipts: ReceiptItem[];
    onReceiptsChange: () => void;
}

export default function Receipts({ tripId, receipts, onReceiptsChange }: ReceiptsProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            setError("Only JPEG, PNG, WebP, and PDF files are allowed");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("receipt", file);
            if (selectedDay) {
                formData.append("dayDate", selectedDay);
            }

            const response = await fetch(
                `${process.env.REACT_APP_API_URL || "http://localhost:5001"}/api/trips/${tripId}/receipts`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("backendToken")}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to upload receipt");
            }

            // Refresh receipts first
            onReceiptsChange();

            // Then clear selected day and reset input
            setSelectedDay(null);
            event.target.value = "";
        } catch (err) {
            console.error("Upload error:", err);
            setError(err instanceof Error ? err.message : "Failed to upload receipt");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (receiptId: string) => {
        if (!confirm("Are you sure you want to delete this receipt?")) {
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || "http://localhost:5001"}/api/trips/${tripId}/receipts/${receiptId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("backendToken")}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete receipt");
            }

            // Refresh receipts
            onReceiptsChange();
        } catch (err) {
            console.error("Delete error:", err);
            setError(err instanceof Error ? err.message : "Failed to delete receipt");
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith("image/")) {
            return <Image className="w-6 h-6 text-blue-600" />;
        }
        if (contentType === "application/pdf") {
            return <FileText className="w-6 h-6 text-red-600" />;
        }
        return <FileText className="w-6 h-6 text-gray-600" />;
    };

    return (
        <div className="bg-white border rounded-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Receipts & Documents</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Upload receipts, tickets, and booking confirmations
                    </p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Upload Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex flex-col items-center justify-center gap-3">
                    <Upload className="w-10 h-10 text-gray-400" />
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            Upload a new receipt
                        </p>
                        <p className="text-xs text-gray-500">
                            JPEG, PNG, WebP, or PDF (max 10MB)
                        </p>
                    </div>

                    <label htmlFor="receipt-upload" className="cursor-pointer">
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={uploading}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById("receipt-upload")?.click();
                            }}
                        >
                            {uploading ? "Uploading..." : "Choose File"}
                        </Button>
                    </label>

                    <input
                        id="receipt-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Receipts List */}
            <div className="space-y-3">
                {receipts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No receipts uploaded yet
                    </div>
                ) : (
                    receipts.map((receipt) => (
                        <div
                            key={receipt.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                    {getFileIcon(receipt.contentType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {receipt.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatFileSize(receipt.size)} • {formatDate(receipt.uploadedAt)}
                                        {receipt.dayDate && ` • ${formatDate(receipt.dayDate)}`}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                    href={receipt.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </a>
                                <button
                                    onClick={() => handleDelete(receipt.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {receipts.length > 0 && (
                <div className="mt-4 text-xs text-gray-500 text-center">
                    {receipts.length} receipt{receipts.length !== 1 ? "s" : ""} uploaded
                </div>
            )}
        </div>
    );
}
