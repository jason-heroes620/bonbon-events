import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import DepositForm from "@/Pages/configurations/deposits/form";

export default function CreateDeposit() {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Create Deposit</h2>}
        >
            <Head title="Create Deposit" />

            <div className="max-w-2xl space-y-4">
                <DepositForm
                    submitUrl="/deposits"
                    method="post"
                    submitLabel="Create"
                    cancelUrl="/deposits"
                />
            </div>
        </AuthenticatedLayout>
    );
}
