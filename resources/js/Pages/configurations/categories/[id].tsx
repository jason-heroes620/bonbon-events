import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import type { Category } from "@/types";
import CategoryForm from "./form";
import { Button } from "@/components/ui/button";

type EditCategoryProps = {
    category: Category;
};

export default function EditCategory({ category }: EditCategoryProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(
            `Delete category "${category.category_name}"?`,
        );
        if (!confirmed) return;

        router.delete(`/categories/${category.category_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Categories</h2>}
        >
            <Head title={`Edit Category: ${category.category_name}`} />

            <div className="max-w-3xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Edit Category
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update category details and status.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <CategoryForm
                        category={category}
                        submitUrl={`/categories/${category.category_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl="/categories"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
