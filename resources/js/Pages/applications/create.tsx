import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import CreateApplicationForm from "./create-form";
import type { Category, Event, Vendor } from "@/types";

type CreateApplicationProps = {
    events: Pick<Event, "event_id" | "event_name" | "require_deposit">[];
    categories: Pick<Category, "category_id" | "category_name">[];
    vendors: Pick<
        Vendor,
        | "vendor_id"
        | "vendor_name"
        | "vendor_contact_person"
        | "vendor_contact_no"
        | "vendor_email"
        | "business_registration_no"
        | "business_description"
        | "category"
        | "social_medias"
        | "vendor_bank_name"
        | "vendor_bank_account_no"
        | "vendor_bank_account_name"
    >[];
};

export default function CreateApplication({
    events,
    categories,
    vendors,
}: CreateApplicationProps) {
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

                    <CreateApplicationForm
                        events={events}
                        categories={categories}
                        vendors={vendors}
                        submitUrl="/applications"
                        cancelUrl="/applications"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
