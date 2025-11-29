import React, { useState } from "react";
import Modal from "../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { geocodeLocation } from "../../lib/geocode";

export default function AddStopModal({ open, onClose, onSubmit }) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            title: "",
            time: "",
            locationName: "",
            description: "",
        },
    });

    const [loading, setLoading] = useState(false);
    const [geoError, setGeoError] = useState("");

    const submit = async (data) => {
        setLoading(true);
        setGeoError("");

        let lat = null;
        let lng = null;

        // Auto-geocode if locationName exists
        if (data.locationName) {
            const result = await geocodeLocation(data.locationName);

            if (result) {
                lat = result.lat;
                lng = result.lng;
            } else {
                setGeoError("Couldn't find this location. Coordinates saved as null.");
            }
        }

        onSubmit(
            data.title,
            data.time,
            data.locationName,
            lat,
            lng,
            data.description
        );

        setLoading(false);
        reset();
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Add Stop">
            <form onSubmit={handleSubmit(submit)} className="space-y-4">

                {/* Smart Fill */}
                <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium">Smart Fill</div>
                    <div className="text-sm text-muted-foreground">
                        Upload a receipt, ticket, or booking confirmation to automatically extract details (mock)
                    </div>
                    <button
                        type="button"
                        className="mt-3 bg-white px-3 py-2 rounded border"
                    >
                        Upload Image/PDF
                    </button>
                </div>

                {/* Title */}
                <div>
                    <label className="text-sm font-medium">Title *</label>
                    <input
                        {...register("title", { required: true })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                        placeholder="e.g., Eiffel Tower"
                    />
                </div>

                {/* Time */}
                <div>
                    <label className="text-sm font-medium">Time</label>
                    <input
                        {...register("time")}
                        type="time"
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="text-sm font-medium">Location</label>
                    <input
                        {...register("locationName")}
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                        placeholder="e.g., Champ de Mars, Paris"
                    />
                    {geoError && (
                        <div className="text-red-600 text-xs mt-1">{geoError}</div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        {...register("description")}
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                        placeholder="Notes, activities, or details about this stop..."
                    />
                </div>

                {/* Buttons */}
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
                        disabled={loading}
                        className="px-4 py-2 rounded bg-indigo-700 text-white disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Add Stop"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
