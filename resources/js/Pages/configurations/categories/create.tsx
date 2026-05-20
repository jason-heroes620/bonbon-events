import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import CategoryForm from "./form";

export default function CreateCategory() {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Categories</h2>}
        >
            <Head title="Create Category" />

            <div className="max-w-3xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">
                            Create Category
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new category.
                        </p>
                    </div>

                    <CategoryForm
                        submitUrl="/categories"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/categories"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
