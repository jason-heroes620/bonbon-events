import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import ChargeForm from "@/Pages/configurations/charges/form";

export default function CreateCharge() {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Create Charge</h2>}
        >
            <Head title="Create Charge" />

            <div className="max-w-2xl space-y-4">
                <ChargeForm
                    submitUrl="/charges"
                    method="post"
                    submitLabel="Create"
                    cancelUrl="/charges"
                />
            </div>
        </AuthenticatedLayout>
    );
}

