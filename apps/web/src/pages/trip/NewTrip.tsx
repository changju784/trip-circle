import React from "react";
import Navbar from "../../components/layout/Navbar";
import FormContainer from "../../components/form/FormContainer";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "../dashboard/BackToDashboardButton";

export default function NewTripPage() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />
                <FormContainer title="Create New Trip" subtitle="Start planning your next adventure">
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-medium mb-1">Trip Title</div>
                            <Input placeholder="e.g., Summer in Europe" />
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Destination City</div>
                            <select className="w-full px-4 py-2 rounded-lg border border-border bg-input-background">
                                <option>Paris</option>
                                <option>Tokyo</option>
                                <option>New York</option>
                                <option>Bangkok</option>
                            </select>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Description (Optional)</div>
                            <textarea className="w-full rounded-lg p-3 border border-border bg-input-background" placeholder="Tell others about your trip..."></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium mb-1">Start Date</div>
                                <input type="date" className="w-full px-4 py-2 rounded-lg border border-border bg-input-background" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">End Date</div>
                                <input type="date" className="w-full px-4 py-2 rounded-lg border border-border bg-input-background" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <input id="public" type="checkbox" />
                                <label htmlFor="public">Make trip public</label>
                            </div>
                            <div className="text-sm text-muted-foreground">Only you can view this trip</div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="muted" onClick={() => navigate(-1)}>Cancel</Button>
                            <Button variant="primary">Create Trip</Button>
                        </div>
                    </div>
                </FormContainer>
            </main>
        </div>
    );
}
