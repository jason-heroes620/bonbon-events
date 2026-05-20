import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import DepositForm from "@/Pages/configurations/deposits/form";
import type { Deposit } from "@/types";

type EditDepositProps = {
    deposit: Deposit;
};

export default function EditDeposit({ deposit }: EditDepositProps) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Edit Deposit</h2>}
        >
            <Head title="Edit Deposit" />

            <div className="max-w-2xl space-y-4">
                <DepositForm
                    deposit={deposit}
                    submitUrl={`/deposits/${deposit.deposit_id}`}
                    method="put"
                    submitLabel="Save"
                    cancelUrl="/deposits"
                />
            </div>
        </AuthenticatedLayout>
    );
}
