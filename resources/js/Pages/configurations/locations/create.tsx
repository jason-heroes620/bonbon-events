import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import LocationForm from "./form";

export default function CreateLocation() {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Locations</h2>}
        >
            <Head title="Create Location" />

            <div className="max-w-3xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">
                            Create Location
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new location for events and configurations.
                        </p>
                    </div>

                    <LocationForm
                        submitUrl="/locations"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/locations"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
