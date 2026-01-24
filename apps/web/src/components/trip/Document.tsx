import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Receipt,
    Upload,
    Eye,
    Trash2,
    Sparkles,
    Loader2,
    AlertCircle,
    RefreshCw,
    CheckCircle2
} from "lucide-react";
import { TripDocument, Trip, getTrip } from "@/lib/trips/trips-api";
import { useTripsContext } from "@/contexts/TripsContext";
import { Badge } from "../ui/badge";
import { CATEGORY_CONFIG } from "@/lib/const/stop-categories";
import { cn } from "@/lib/utils";

interface DocumentsProps {
    tripId: string;
    documents: TripDocument[];
    onDocumentsChange: (updatedTrip: Trip) => void;
    onSuggestionReview: (doc: TripDocument) => void;
}

export default function Documents({
    tripId,
    documents,
    onDocumentsChange,
    onSuggestionReview
}: DocumentsProps) {
    const { uploadDocument, deleteDocument, parseDocument, } = useTripsContext();
    const [uploading, setUploading] = useState(false);
    const [parsingId, setParsingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const updatedTrip = await uploadDocument(tripId, file);
            onDocumentsChange(updatedTrip);
            event.target.value = "";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleParse = async (docId: string) => {
        setParsingId(docId);
        setError(null);
        try {
            await parseDocument(tripId, docId);
            const updatedTrip = await getTrip(tripId);
            onDocumentsChange(updatedTrip);

        } catch (err) {
            setError("AI parsing failed.");
        } finally {
            setParsingId(null);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm("Delete this document?")) return;
        try {
            const updatedTrip = await deleteDocument(tripId, docId);
            onDocumentsChange(updatedTrip);
        } catch (err) {
            setError("Failed to delete document");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Documents & Receipts</h3>
                    <p className="text-sm text-gray-500">Upload and AI-parse your travel documents</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Upload Area */}
            <div className="mb-8 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/20 text-center">
                <input
                    id="doc-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Click to upload a new document</p>
                <Button
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("doc-upload")?.click()}
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {uploading ? "Uploading..." : "Select File"}
                </Button>
            </div>

            {/* Document List */}
            <div className="space-y-4">
                {documents.length === 0 ? (
                    <p className="text-center py-6 text-gray-400 italic text-sm">No documents uploaded yet.</p>
                ) : (
                    documents.map((doc) => {
                        // Extract category info for the suggestion UI
                        const category = doc.extractedData?.category || 'none';
                        const categoryInfo = CATEGORY_CONFIG[category];
                        const CategoryIcon = categoryInfo.icon;

                        return (
                            <div key={doc._id} className="flex flex-col gap-2 p-4 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-colors hover:border-gray-300 dark:hover:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="font-semibold truncate text-gray-900 dark:text-gray-100">
                                            {doc.name}
                                        </div>
                                        <div className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${doc.status === 'parsed' ? 'bg-green-50 text-green-600 border-green-100' :
                                            doc.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-gray-50 text-gray-500 border-gray-100'
                                            }`}>
                                            {doc.status}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {doc.status !== 'processing' && !doc.isApplied && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                onClick={() => handleParse(doc._id)}
                                                disabled={parsingId === doc._id}
                                            >
                                                {parsingId === doc._id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                ) : doc.status === 'parsed' ? (
                                                    <RefreshCw className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                )}
                                                {doc.status === 'parsed' ? "Re-parse" : "Parse"}
                                            </Button>
                                        )}

                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                            rel="noreferrer"
                                            title="View Document"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(doc._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* SUGGESTION RESULT LAYER */}
                                {doc.status === 'parsed' && !doc.isApplied && (
                                    <div className="mt-3 relative pl-6">
                                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent dark:from-blue-900/50" />

                                        <div className="border border-dashed border-blue-300 dark:border-blue-800/60 rounded-lg p-3 bg-blue-50/30 dark:bg-blue-900/10 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">

                                            {/* Left Slot: Status Icon with Match Score Tooltip */}
                                            <div
                                                className="p-1 cursor-help shrink-0"
                                                title={`AI Match Confidence: ${Math.round((doc.extractedData?.aiInsights?.matchScore ?? 0) * 100)}%`}
                                            >
                                                {(doc.extractedData?.aiInsights?.matchScore ?? 0) < 0.6 ? (
                                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                )}
                                            </div>

                                            {/* Content Area - Matches StopItem Structure */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {doc.extractedData?.vendor || "Suggested Stop"}
                                                    </div>

                                                    <Badge
                                                        variant="outline"
                                                        className="bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0 flex items-center gap-1 shrink-0"
                                                    >
                                                        <Sparkles className="h-3 w-3" />
                                                        AI
                                                    </Badge>

                                                    {category !== 'none' && (
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "hidden md:flex items-center gap-1 px-2 py-0 text-[10px] font-normal border shrink-0",
                                                                categoryInfo.color
                                                            )}
                                                        >
                                                            <CategoryIcon className="h-3 w-3" />
                                                            {categoryInfo.label}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="text-sm text-muted-foreground dark:text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                    {/* Date & Time */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span>
                                                            {doc.extractedData?.date ? new Date(doc.extractedData.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
                                                        </span>
                                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                                        <span>
                                                            {doc.extractedData?.date ? new Date(doc.extractedData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                                        </span>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="font-medium text-indigo-600 dark:text-indigo-400 shrink-0">
                                                        {doc.extractedData?.amount ? `$${doc.extractedData.amount.toLocaleString()}` : "Free"}
                                                    </div>

                                                    {/* Truncated Reasoning/Description */}
                                                    <div className="truncate flex-1 italic text-xs text-blue-600/80 dark:text-blue-400/80 min-w-[100px]">
                                                        {doc.extractedData?.aiInsights?.reasoning || "Matched via trip context"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-1 shrink-0">
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all"
                                                    onClick={() => onSuggestionReview(doc)}
                                                >
                                                    Review & Add
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* FAILED STATE UI */}
                                {doc.status === 'failed' && (
                                    <div className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Extraction failed. Try re-parsing or uploading a clearer image.
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}