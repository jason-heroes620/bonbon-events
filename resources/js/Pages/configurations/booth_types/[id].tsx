import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import type { BoothType } from "@/types";
import BoothTypeForm from "./form";
import { Button } from "@/components/ui/button";

type EditBoothTypeProps = {
    boothType: BoothType;
};

export default function EditBoothType({ boothType }: EditBoothTypeProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(
            `Delete booth type "${boothType.booth_type_name}"?`,
        );
        if (!confirmed) return;

        router.delete(`/booth-types/${boothType.booth_type_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Booth Types</h2>}
        >
            <Head title={`Edit Booth Type: ${boothType.booth_type_name}`} />

            <div className="max-w-3xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Edit Booth Type
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update booth type details and status.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <BoothTypeForm
                        boothType={boothType}
                        submitUrl={`/booth-types/${boothType.booth_type_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl="/booth-types"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
