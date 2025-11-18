import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, MapPin, Clock, Upload, FileImage, Wand2, Map as MapIcon } from 'lucide-react';
import { getTripById, updateTrip, type Trip, type Stop } from '../lib/storage';
import { toast } from 'sonner@2.0.3';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripMap } from './TripMap';

interface ItineraryEditorProps {
    tripId: string;
    onBack: () => void;
}

const ItemType = {
    STOP: 'stop'
};

interface DragItem {
    index: number;
    dayIndex: number;
}

function StopItem({
    stop,
    index,
    dayIndex,
    onEdit,
    onDelete,
    moveStop
}: {
    stop: Stop;
    index: number;
    dayIndex: number;
    onEdit: () => void;
    onDelete: () => void;
    moveStop: (dragIndex: number, hoverIndex: number, dragDay: number, hoverDay: number) => void;
}) {
    const [{ isDragging }, drag] = useDrag({
        type: ItemType.STOP,
        item: { index, dayIndex },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: ItemType.STOP,
        hover: (item: DragItem) => {
            if (item.dayIndex !== dayIndex || item.index !== index) {
                moveStop(item.index, index, item.dayIndex, dayIndex);
                item.index = index;
                item.dayIndex = dayIndex;
            }
        },
    });

    return (
        <div
            ref={(node) => drag(drop(node))}
            className={`bg-white rounded-lg border border-gray-200 p-4 ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="flex items-start gap-3">
                <div className="cursor-move mt-1">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-gray-900">{stop.title}</h4>
                        <div className="flex gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {stop.time && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {stop.time}
                        </div>
                    )}
                    {stop.location && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {stop.location}
                        </div>
                    )}
                    {stop.description && (
                        <p className="text-sm text-gray-600 mt-2">{stop.description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ItineraryEditor({ tripId, onBack }: ItineraryEditorProps) {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [activeDay, setActiveDay] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStop, setEditingStop] = useState<{ dayIndex: number; stopIndex: number } | null>(null);
    const [stopForm, setStopForm] = useState({
        title: '',
        time: '',
        location: '',
        description: ''
    });
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTrip();
    }, [tripId]);

    const loadTrip = () => {
        const loadedTrip = getTripById(tripId);
        if (loadedTrip) {
            setTrip(loadedTrip);
        }
    };

    const handleAddStop = (dayIndex: number) => {
        setEditingStop(null);
        setStopForm({ title: '', time: '', location: '', description: '' });
        setUploadedFile(null);
        setActiveDay(dayIndex);
        setDialogOpen(true);
    };

    const handleEditStop = (dayIndex: number, stopIndex: number) => {
        if (!trip) return;
        const stop = trip.itinerary[dayIndex].stops[stopIndex];
        setEditingStop({ dayIndex, stopIndex });
        setStopForm({
            title: stop.title,
            time: stop.time,
            location: stop.location,
            description: stop.description
        });
        setDialogOpen(true);
    };

    const handleDeleteStop = (dayIndex: number, stopIndex: number) => {
        if (!trip) return;

        const newItinerary = [...trip.itinerary];
        newItinerary[dayIndex].stops.splice(stopIndex, 1);

        const updatedTrip = updateTrip(trip.id, { itinerary: newItinerary });
        setTrip(updatedTrip);
        toast.success('Stop deleted');
    };

    const handleSaveStop = () => {
        if (!trip) return;

        const newItinerary = [...trip.itinerary];
        const newStop: Stop = {
            id: editingStop ? trip.itinerary[editingStop.dayIndex].stops[editingStop.stopIndex].id : crypto.randomUUID(),
            ...stopForm
        };

        if (editingStop) {
            newItinerary[editingStop.dayIndex].stops[editingStop.stopIndex] = newStop;
            toast.success('Stop updated');
        } else {
            newItinerary[activeDay].stops.push(newStop);
            toast.success('Stop added');
        }

        const updatedTrip = updateTrip(trip.id, { itinerary: newItinerary });
        setTrip(updatedTrip);
        setDialogOpen(false);
    };

    const moveStop = (dragIndex: number, hoverIndex: number, dragDay: number, hoverDay: number) => {
        if (!trip) return;

        const newItinerary = [...trip.itinerary];

        // Remove from original position
        const [movedStop] = newItinerary[dragDay].stops.splice(dragIndex, 1);

        // Insert at new position
        newItinerary[hoverDay].stops.splice(hoverIndex, 0, movedStop);

        const updatedTrip = updateTrip(trip.id, { itinerary: newItinerary });
        setTrip(updatedTrip);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setIsProcessing(true);

        // Simulate AI processing with a delay
        setTimeout(() => {
            // Mock AI parsing - extract information from filename and random data
            const fileName = file.name.toLowerCase();

            // Try to extract information from filename
            let title = '';
            let location = '';
            let time = '';
            let description = '';

            // Common patterns in receipts
            if (fileName.includes('restaurant') || fileName.includes('dinner') || fileName.includes('lunch')) {
                title = 'Restaurant Visit';
                description = 'Meal at local restaurant';
            } else if (fileName.includes('hotel') || fileName.includes('booking')) {
                title = 'Hotel Check-in';
                description = 'Accommodation';
            } else if (fileName.includes('museum') || fileName.includes('ticket')) {
                title = 'Museum Visit';
                description = 'Cultural attraction';
            } else if (fileName.includes('transport') || fileName.includes('taxi') || fileName.includes('uber')) {
                title = 'Transportation';
                description = 'Travel between locations';
            } else {
                title = 'Activity';
                description = 'Extracted from uploaded document';
            }

            // Mock time extraction (could be from OCR in real implementation)
            const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
            const minute = Math.random() > 0.5 ? '00' : '30';
            time = `${hour.toString().padStart(2, '0')}:${minute}`;

            // Update form with extracted data
            setStopForm(prev => ({
                ...prev,
                title: prev.title || title,
                time: prev.time || time,
                description: prev.description || description,
            }));

            setIsProcessing(false);
            toast.success('Details extracted! Please review and edit as needed.');
        }, 1500);
    };

    const handleSmartFill = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (!trip) {
        return <div>Loading...</div>;
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <Button variant="ghost" onClick={onBack} className="mb-3">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <div>
                            <h1 className="text-2xl text-gray-900">{trip.title}</h1>
                            <p className="text-gray-600 mt-1">
                                <MapPin className="inline h-4 w-4 mr-1" />
                                {trip.city} • {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Day Tabs and Stops */}
                        <div className="lg:col-span-2">
                            <Tabs value={activeDay.toString()} onValueChange={(value) => setActiveDay(parseInt(value))}>
                                <TabsList className="mb-6">
                                    {trip.itinerary.map((day, index) => (
                                        <TabsTrigger key={index} value={index.toString()}>
                                            Day {day.day}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {trip.itinerary.map((day, dayIndex) => (
                                    <TabsContent key={dayIndex} value={dayIndex.toString()}>
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle>Day {day.day}</CardTitle>
                                                        <CardDescription>{formatDate(day.date)}</CardDescription>
                                                    </div>
                                                    <Button onClick={() => handleAddStop(dayIndex)}>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Stop
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {day.stops.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-500">
                                                        <p>No stops planned for this day yet.</p>
                                                        <Button variant="link" onClick={() => handleAddStop(dayIndex)} className="mt-2">
                                                            Add your first stop
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {day.stops.map((stop, stopIndex) => (
                                                            <StopItem
                                                                key={stop.id}
                                                                stop={stop}
                                                                index={stopIndex}
                                                                dayIndex={dayIndex}
                                                                onEdit={() => handleEditStop(dayIndex, stopIndex)}
                                                                onDelete={() => handleDeleteStop(dayIndex, stopIndex)}
                                                                moveStop={moveStop}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>

                        {/* Right: Map View */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <MapIcon className="h-5 w-5" />
                                            Route Preview
                                        </CardTitle>
                                        <CardDescription>Live map of your stops</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[500px]">
                                            <TripMap
                                                stops={trip.itinerary.flatMap(day => day.stops)}
                                                city={trip.city}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Add/Edit Stop Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingStop ? 'Edit Stop' : 'Add Stop'}</DialogTitle>
                            <DialogDescription>
                                {editingStop ? 'Update the details of this stop' : 'Add a new stop to your itinerary'}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Smart Fill Option */}
                        {!editingStop && (
                            <>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Wand2 className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-sm text-blue-900 mb-1">Smart Fill</h4>
                                            <p className="text-xs text-blue-700 mb-3">
                                                Upload a receipt, ticket, or booking confirmation to automatically extract details
                                            </p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSmartFill}
                                                disabled={isProcessing}
                                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Upload Image/PDF
                                                    </>
                                                )}
                                            </Button>
                                            {uploadedFile && (
                                                <div className="mt-2 flex items-center gap-2 text-xs text-blue-700">
                                                    <FileImage className="h-4 w-4" />
                                                    {uploadedFile.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="stop-title">Title *</Label>
                                <Input
                                    id="stop-title"
                                    placeholder="e.g., Eiffel Tower"
                                    value={stopForm.title}
                                    onChange={(e) => setStopForm({ ...stopForm, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stop-time">Time</Label>
                                <Input
                                    id="stop-time"
                                    type="time"
                                    value={stopForm.time}
                                    onChange={(e) => setStopForm({ ...stopForm, time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stop-location">Location</Label>
                                <Input
                                    id="stop-location"
                                    placeholder="e.g., Champ de Mars, Paris"
                                    value={stopForm.location}
                                    onChange={(e) => setStopForm({ ...stopForm, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stop-description">Description</Label>
                                <Textarea
                                    id="stop-description"
                                    placeholder="Notes, activities, or details about this stop..."
                                    value={stopForm.description}
                                    onChange={(e) => setStopForm({ ...stopForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveStop} disabled={!stopForm.title}>
                                {editingStop ? 'Update' : 'Add'} Stop
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DndProvider>
    );
}
