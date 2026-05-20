import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import ApplicationForm from "./form";
import type { Application, Category, Event, Vendor } from "@/types";
import { Button } from "@/components/ui/button";

type ApplicationEventBooth = {
    event_booth_id: string;
    booth_id: string;
    booth_price: number | string;
    occupied: boolean;
    booth_name: string;
    booth_type_id: string;
    booth_type_name: string;
};

type ApplicationOrder = {
    order_id: string;
    order_no: string;
    total_price: number | string;
    discount_price: number | string;
    is_paid: boolean;
    created_at: Date;
};

type ApplicationInvoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_status: string;
    invoice_amount: number | string;
};

type EditApplicationProps = {
    application: Application;
    event: Pick<Event, "event_id" | "event_name" | "require_deposit">;
    vendor: Pick<
        Vendor,
        | "vendor_id"
        | "vendor_name"
        | "vendor_contact_person"
        | "vendor_contact_no"
        | "vendor_email"
        | "business_description"
        | "category"
        | "social_medias"
    >;
    categories: Pick<Category, "category_id" | "category_name">[];
    eventBooths: ApplicationEventBooth[];
    selectedEventBoothIds: string[];
    order: ApplicationOrder | null;
    invoice: ApplicationInvoice | null;
    depositAmount: number | string;
};

export default function EditApplication({
    application,
    event,
    vendor,
    categories,
    eventBooths,
    selectedEventBoothIds,
    order,
    invoice,
    depositAmount,
}: EditApplicationProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(
            `Delete application "${application.application_code}"?`,
        );
        if (!confirmed) return;

        router.delete(`/applications/${application.application_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Applications</h2>}
        >
            <Head title={`Edit Application: ${application.application_code}`} />

            <div className="max-w-5xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Edit Application
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update application details and status.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <ApplicationForm
                        application={application}
                        event={event}
                        vendor={vendor}
                        categories={categories}
                        eventBooths={eventBooths}
                        selectedEventBoothIds={selectedEventBoothIds}
                        order={order}
                        invoice={invoice}
                        depositAmount={depositAmount}
                        confirmBoothsUrl={`/applications/${application.application_id}/confirm-booths`}
                        generateInvoiceUrl={`/applications/${application.application_id}/generate-invoice`}
                        sendPaymentReminderUrl={`/applications/${application.application_id}/send-payment-reminder`}
                        updateStatusUrl={`/applications/${application.application_id}/update-status`}
                        submitUrl={`/applications/${application.application_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl="/applications"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
