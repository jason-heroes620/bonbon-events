import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import InvoiceNoForm from "./form";
import { Button } from "@/components/ui/button";

type EditInvoiceNoProps = {
    invoiceNo: {
        invoice_no_id: string;
        prefix: string;
        invoice_no: string;
        suffix: string;
        length: number;
    };
};

export default function EditInvoiceNo({ invoiceNo }: EditInvoiceNoProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(
            `Delete invoice no "${invoiceNo.prefix}${invoiceNo.invoice_no}${invoiceNo.suffix}"?`,
        );
        if (!confirmed) return;

        router.delete(`/invoice-nos/${invoiceNo.invoice_no_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Invoice No</h2>}
        >
            <Head title="Edit Invoice No" />

            <div className="max-w-3xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Edit Invoice No
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update invoice no details.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <InvoiceNoForm
                        invoiceNo={invoiceNo}
                        submitUrl={`/invoice-nos/${invoiceNo.invoice_no_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl="/invoice-nos"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
