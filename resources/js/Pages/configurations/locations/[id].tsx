import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import type { Location } from "@/types";
import LocationForm from "./form";
import { Button } from "@/components/ui/button";

type EditLocationProps = {
    location: Location;
};

export default function EditLocation({ location }: EditLocationProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(
            `Delete location "${location.location_name}"?`,
        );
        if (!confirmed) return;

        router.delete(`/locations/${location.location_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Locations</h2>}
        >
            <Head title={`Edit Location: ${location.location_name}`} />

            <div className="max-w-3xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Edit Location
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update location details and status.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <LocationForm
                        location={location}
                        submitUrl={`/locations/${location.location_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl="/locations"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
