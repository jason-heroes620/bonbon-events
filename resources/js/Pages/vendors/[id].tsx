import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import VendorForm from "./form";
import type { Category, User, Vendor } from "@/types";
import { Button } from "@/components/ui/button";

type EditVendorProps = {
    vendor: Vendor;
    users: Pick<User, "user_id" | "name" | "email">[];
    categories: Pick<Category, "category_id" | "category_name">[];
};

export default function EditVendor({ vendor, users, categories }: EditVendorProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(`Delete vendor "${vendor.vendor_name}"?`);
        if (!confirmed) return;

        router.delete(`/vendors/${vendor.vendor_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Vendors</h2>}
        >
            <Head title={`Edit Vendor: ${vendor.vendor_name}`} />

            <div className="max-w-5xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">Edit Vendor</h1>
                            <p className="text-sm text-muted-foreground">
                                Update vendor profile details and status.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <VendorForm
                        vendor={vendor}
                        users={users}
                        categories={categories}
                        submitUrl={`/vendors/${vendor.vendor_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl="/vendors"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
