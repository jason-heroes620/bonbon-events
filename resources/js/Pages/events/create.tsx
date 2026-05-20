import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import EventForm from "./form";
import type { Deposit, Location, BoothType, Booth } from "@/types";

type CreateEventProps = {
    locations: Pick<Location, "location_id" | "location_name">[];
    deposits: Pick<
        Deposit,
        "deposit_id" | "deposit_description" | "deposit_amount"
    >[];
    boothTypes: Pick<BoothType, "booth_type_id" | "booth_type_name">[];
    booths: Pick<Booth, "booth_id" | "booth_type_id" | "booth_name">[];
};

export default function CreateEvent({
    locations,
    deposits,
    boothTypes,
    booths,
}: CreateEventProps) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Events</h2>}
        >
            <Head title="Create Event" />

            <div className="max-w-6xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">Create Event</h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new event.
                        </p>
                    </div>

                    <EventForm
                        locations={locations}
                        deposits={deposits}
                        boothTypes={boothTypes}
                        booths={booths}
                        submitUrl="/events"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/events"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
