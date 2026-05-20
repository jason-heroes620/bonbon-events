import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import InvoiceNoForm from "./form";

export default function CreateInvoiceNo() {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Invoice No</h2>}
        >
            <Head title="Create Invoice No" />

            <div className="max-w-3xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">
                            Create Invoice No
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new invoice no.
                        </p>
                    </div>

                    <InvoiceNoForm
                        submitUrl="/invoice-nos"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/invoice-nos"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

