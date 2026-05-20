import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import VendorForm from "./form";
import type { Category, User } from "@/types";

type CreateVendorProps = {
    users: Pick<User, "user_id" | "name" | "email">[];
    categories: Pick<Category, "category_id" | "category_name">[];
};

export default function CreateVendor({ users, categories }: CreateVendorProps) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Vendors</h2>}
        >
            <Head title="Create Vendor" />

            <div className="max-w-5xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">Create Vendor</h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new vendor profile.
                        </p>
                    </div>

                    <VendorForm
                        users={users}
                        categories={categories}
                        submitUrl="/vendors"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/vendors"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
