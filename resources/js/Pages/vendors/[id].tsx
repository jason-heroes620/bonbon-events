import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import VendorForm from "./form";
import type { Category, User, Vendor } from "@/types";
import { Button } from "@/components/ui/button";

type ReturnToVendorsQuery = {
    search?: string | null;
    status?: string | null;
    page?: number | null;
};

type EditVendorProps = {
    vendor: Vendor;
    users: Pick<User, "user_id" | "name" | "email">[];
    categories: Pick<Category, "category_id" | "category_name">[];
    return_to_vendors_query?: ReturnToVendorsQuery;
};

function buildVendorsReturnUrl(
    query?: ReturnToVendorsQuery | null,
): string {
    if (!query) return "/vendors";
    const params: Record<string, string> = {};
    if (typeof query.search === "string" && query.search.trim() !== "") {
        params.search = query.search.trim();
    }
    if (
        typeof query.status === "string" &&
        (query.status === "pending" ||
            query.status === "approved" ||
            query.status === "rejected")
    ) {
        params.status = query.status;
    }
    if (typeof query.page === "number" && Number.isFinite(query.page) && query.page > 1) {
        params.page = String(query.page);
    }
    const qs = new URLSearchParams(params).toString();
    return qs ? `/vendors?${qs}` : "/vendors";
}

export default function EditVendor({
    vendor,
    users,
    categories,
    return_to_vendors_query,
}: EditVendorProps) {
    const cancelUrl = buildVendorsReturnUrl(return_to_vendors_query ?? null);
    const returnParams: Record<string, string> = {};
    const q = return_to_vendors_query ?? null;
    if (typeof q?.search === "string" && q.search.trim() !== "") {
        returnParams.return_search = q.search.trim();
    }
    if (
        typeof q?.status === "string" &&
        (q.status === "pending" ||
            q.status === "approved" ||
            q.status === "rejected")
    ) {
        returnParams.return_status = q.status;
    }
    if (typeof q?.page === "number" && Number.isFinite(q.page) && q.page > 1) {
        returnParams.return_page = String(q.page);
    }

    const handleDelete = () => {
        const confirmed = window.confirm(
            `Delete vendor "${vendor.vendor_name}"?`,
        );
        if (!confirmed) return;

        router.delete(`/vendors/${vendor.vendor_id}`, {
            data: returnParams,
        });
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
                            <h1 className="text-lg font-semibold">
                                Edit Vendor
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update vendor profile details and status.
                            </p>
                        </div>

                        <Button
                            variant="destructive"
                            type="button"
                            onClick={handleDelete}
                        >
                            Delete Vendor
                        </Button>
                    </div>

                    <VendorForm
                        vendor={vendor}
                        users={users}
                        categories={categories}
                        submitUrl={`/vendors/${vendor.vendor_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl={cancelUrl}
                        returnParams={returnParams}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
