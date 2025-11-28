import React from "react";
import Modal from "../../components/ui/Modal";
import { useForm } from "react-hook-form";

export default function AddStopModal({ open, onClose, onSubmit }) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            title: "",
            time: "",
            locationName: "",
            lat: "",
            lng: "",
            description: "",
        },
    });

    const submit = (data) => {
        onSubmit(
            data.title,
            data.time,
            data.locationName,
            data.lat ? Number(data.lat) : null,
            data.lng ? Number(data.lng) : null,
            data.description
        );

        reset();
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Add Stop">
            <form onSubmit={handleSubmit(submit)} className="space-y-4">

                <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium">Smart Fill</div>
                    <div className="text-sm text-muted-foreground">
                        Upload booking/receipt to auto-fill (mock)
                    </div>
                    <button
                        type="button"
                        className="mt-3 bg-white px-3 py-2 rounded border"
                    >
                        Upload Image/PDF
                    </button>
                </div>

                <div>
                    <label className="text-sm font-medium">Title *</label>
                    <input
                        {...register("title", { required: true })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Time</label>
                    <input
                        {...register("time")}
                        type="time"
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Location</label>
                    <input
                        {...register("locationName")}
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium">Latitude</label>
                        <input
                            {...register("lat")}
                            className="w-full mt-1 px-3 py-2 rounded-lg border"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Longitude</label>
                        <input
                            {...register("lng")}
                            className="w-full mt-1 px-3 py-2 rounded-lg border"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        {...register("description")}
                        className="w-full mt-1 px-3 py-2 rounded-lg border"
                    />
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
                        className="px-4 py-2 rounded bg-indigo-700 text-white"
                    >
                        Add Stop
                    </button>
                </div>
            </form>
        </Modal>
    );
}
