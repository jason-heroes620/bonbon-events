import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import ApplicationForm from "./form";
import type { Event } from "@/types";

type CreateApplicationProps = {
    events: Pick<Event, "event_id" | "event_name">[];
};

export default function CreateApplication({ events }: CreateApplicationProps) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Applications</h2>}
        >
            <Head title="Create Application" />

            <div className="max-w-5xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">
                            Create Application
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new application.
                        </p>
                    </div>

                    <ApplicationForm
                        event={events}
                        submitUrl="/applications"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/applications"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
