import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Deposit } from "@/types";
import type { FormEvent } from "react";

type DepositFormData = {
    deposit_description: string;
    deposit_amount: string;
    deposit_start_date: string;
    deposit_end_date: string;
    deposit_status: "active" | "inactive";
};

type DepositFormProps = {
    deposit?: Deposit;
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

export default function DepositForm({
    deposit,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: DepositFormProps) {
    const form = useForm<DepositFormData>({
        deposit_description: deposit?.deposit_description ?? "",
        deposit_amount:
            deposit?.deposit_amount != null
                ? String(deposit.deposit_amount)
                : "",
        deposit_start_date: deposit?.deposit_start_date ?? "",
        deposit_end_date: deposit?.deposit_end_date ?? "",
        deposit_status: deposit?.deposit_status ?? "active",
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (method === "post") {
            form.post(submitUrl);
            return;
        }

        form.put(submitUrl);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
                <label
                    htmlFor="deposit_description"
                    className="text-sm font-medium"
                >
                    Description
                </label>
                <Input
                    id="deposit_description"
                    value={form.data.deposit_description}
                    onChange={(e) =>
                        form.setData("deposit_description", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.deposit_description)}
                />
                {form.errors.deposit_description ? (
                    <p className="text-sm text-red-600">
                        {form.errors.deposit_description}
                    </p>
                ) : null}
            </div>

            <div className="space-y-2">
                <label htmlFor="deposit_amount" className="text-sm font-medium">
                    Amount
                </label>
                <Input
                    id="deposit_amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={form.data.deposit_amount}
                    onChange={(e) =>
                        form.setData("deposit_amount", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.deposit_amount)}
                />
                {form.errors.deposit_amount ? (
                    <p className="text-sm text-red-600">
                        {form.errors.deposit_amount}
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label
                        htmlFor="deposit_start_date"
                        className="text-sm font-medium"
                    >
                        Start Date
                    </label>
                    <Input
                        id="deposit_start_date"
                        type="date"
                        value={form.data.deposit_start_date}
                        onChange={(e) =>
                            form.setData("deposit_start_date", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.deposit_start_date)}
                    />
                    {form.errors.deposit_start_date ? (
                        <p className="text-sm text-red-600">
                            {form.errors.deposit_start_date}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="deposit_end_date"
                        className="text-sm font-medium"
                    >
                        End Time
                    </label>
                    <Input
                        id="deposit_end_date"
                        type="time"
                        value={form.data.deposit_end_date}
                        onChange={(e) =>
                            form.setData("deposit_end_date", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.deposit_end_date)}
                    />
                    {form.errors.deposit_end_date ? (
                        <p className="text-sm text-red-600">
                            {form.errors.deposit_end_date}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="deposit_status" className="text-sm font-medium">
                    Status
                </label>
                <select
                    id="deposit_status"
                    className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                    value={form.data.deposit_status}
                    onChange={(e) =>
                        form.setData(
                            "deposit_status",
                            e.target.value as DepositFormData["deposit_status"],
                        )
                    }
                    aria-invalid={Boolean(form.errors.deposit_status)}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                {form.errors.deposit_status ? (
                    <p className="text-sm text-red-600">
                        {form.errors.deposit_status}
                    </p>
                ) : null}
            </div>

            <div className="flex justify-end items-center gap-2">
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.visit(cancelUrl)}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
