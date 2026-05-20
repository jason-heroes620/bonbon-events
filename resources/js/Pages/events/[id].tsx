import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import EventForm from "./form";
import type { Event, Location, Deposit, BoothType, Booth } from "@/types";
import { Button } from "@/components/ui/button";

type EditEventProps = {
    event: Event;
    locations: Pick<Location, "location_id" | "location_name">[];
    deposits: Pick<
        Deposit,
        "deposit_id" | "deposit_description" | "deposit_amount"
    >[];
    boothTypes: Pick<BoothType, "booth_type_id" | "booth_type_name">[];
    booths: Pick<Booth, "booth_id" | "booth_type_id" | "booth_name">[];
};

export default function EditEvent({
    event,
    locations,
    deposits,
    boothTypes,
    booths,
}: EditEventProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(`Delete event "${event.event_name}"?`);
        if (!confirmed) return;

        router.delete(`/events/${event.event_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Events</h2>}
        >
            <Head title={`Edit Event: ${event.event_name}`} />

            <div className="max-w-6xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Edit Event
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update event details.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <EventForm
                        event={event}
                        locations={locations}
                        deposits={deposits}
                        boothTypes={boothTypes}
                        booths={booths}
                        submitUrl={`/events/${event.event_id}`}
                        method="post"
                        submitLabel="Save"
                        cancelUrl="/events"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
