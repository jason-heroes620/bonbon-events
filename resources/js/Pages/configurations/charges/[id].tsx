import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import ChargeForm from "@/Pages/configurations/charges/form";
import type { Charge } from "@/types";

type EditChargeProps = {
    charge: Charge;
};

export default function EditCharge({ charge }: EditChargeProps) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Edit Charge</h2>}
        >
            <Head title="Edit Charge" />

            <div className="max-w-2xl space-y-4">
                <ChargeForm
                    charge={charge}
                    submitUrl={`/charges/${charge.charges_id}`}
                    method="put"
                    submitLabel="Save"
                    cancelUrl="/charges"
                />
            </div>
        </AuthenticatedLayout>
    );
}

