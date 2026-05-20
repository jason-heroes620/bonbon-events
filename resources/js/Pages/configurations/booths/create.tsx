import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import BoothForm from "./form";
import type { BoothType } from "@/types";

type CreateBoothProps = {
    boothTypes: BoothType[];
};

export default function CreateBooth({ boothTypes }: CreateBoothProps) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Booths</h2>}
        >
            <Head title="Create Booth" />

            <div className="max-w-3xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">Create Booth</h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new booth.
                        </p>
                    </div>

                    <BoothForm
                        boothTypes={boothTypes}
                        submitUrl="/booths"
                        method="post"
                        submitLabel="Create"
                        cancelUrl="/booths"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
