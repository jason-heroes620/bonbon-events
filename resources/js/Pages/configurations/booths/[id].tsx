import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import type { Booth, BoothType } from "@/types";
import BoothForm from "./form";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";

type EditBoothProps = {
    booth: Booth;
    boothTypes: BoothType[];
};

export default function EditBooth({ booth, boothTypes }: EditBoothProps) {
    const handleDelete = () => {
        const confirmed = window.confirm(`Delete booth "${booth.booth_name}"?`);
        if (!confirmed) return;

        router.delete(`/booths/${booth.booth_id}`);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Booths</h2>}
        >
            <Head title={`Edit Booth: ${booth.booth_name}`} />
            <Toaster />
            <div className="max-w-3xl space-y-4">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Edit Booth
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Update booth details and status.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>

                    <BoothForm
                        boothTypes={boothTypes}
                        booth={booth}
                        submitUrl={`/booths/${booth.booth_id}`}
                        method="put"
                        submitLabel="Save"
                        cancelUrl="/booths"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
