import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import BoothTypeForm from "./form";

export default function CreateBoothType() {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Booth Types</h2>}
        >
            <Head title="Create Booth Type" />

            <div className="max-w-3xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">
                            Create Booth Type
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new booth type.
                        </p>
                    </div>

                    <BoothTypeForm
                        submitUrl="/booth-types"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/booth-types"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
