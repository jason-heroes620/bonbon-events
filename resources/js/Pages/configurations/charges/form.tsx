import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Charge } from "@/types";
import type { FormEvent } from "react";

type ChargeFormData = {
    charges_name: string;
    charges_type: "F" | "P";
    charges_rate: string;
    charges_description: string;
    charges_start_date: string;
    charges_end_date: string;
    charges_status: "1" | "0";
    sort_order: string;
};

type ChargeFormProps = {
    charge?: Charge;
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

const selectClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function ChargeForm({
    charge,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: ChargeFormProps) {
    const form = useForm<ChargeFormData>({
        charges_name: charge?.charges_name ?? "",
        charges_type: charge?.charges_type ?? "F",
        charges_rate:
            charge?.charges_rate != null ? String(charge.charges_rate) : "",
        charges_description: charge?.charges_description ?? "",
        charges_start_date: charge?.charges_start_date ?? "",
        charges_end_date: charge?.charges_end_date ?? "",
        charges_status: charge?.charges_status === false ? "0" : "1",
        sort_order:
            charge?.sort_order != null ? String(charge.sort_order) : "1",
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
                <label htmlFor="charges_name" className="text-sm font-medium">
                    Name
                </label>
                <Input
                    id="charges_name"
                    value={form.data.charges_name}
                    onChange={(e) =>
                        form.setData("charges_name", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.charges_name)}
                />
                {form.errors.charges_name ? (
                    <p className="text-sm text-red-600">
                        {form.errors.charges_name}
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="charges_type" className="text-sm font-medium">
                        Type
                    </label>
                    <select
                        id="charges_type"
                        className={selectClassName}
                        value={form.data.charges_type}
                        onChange={(e) =>
                            form.setData(
                                "charges_type",
                                e.target.value as ChargeFormData["charges_type"],
                            )
                        }
                        aria-invalid={Boolean(form.errors.charges_type)}
                    >
                        <option value="F">Fixed</option>
                        <option value="P">Percentage</option>
                    </select>
                    {form.errors.charges_type ? (
                        <p className="text-sm text-red-600">
                            {form.errors.charges_type}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label htmlFor="charges_rate" className="text-sm font-medium">
                        Rate
                    </label>
                    <Input
                        id="charges_rate"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={form.data.charges_rate}
                        onChange={(e) =>
                            form.setData("charges_rate", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.charges_rate)}
                    />
                    {form.errors.charges_rate ? (
                        <p className="text-sm text-red-600">
                            {form.errors.charges_rate}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="charges_description"
                    className="text-sm font-medium"
                >
                    Description
                </label>
                <Input
                    id="charges_description"
                    value={form.data.charges_description}
                    onChange={(e) =>
                        form.setData("charges_description", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.charges_description)}
                />
                {form.errors.charges_description ? (
                    <p className="text-sm text-red-600">
                        {form.errors.charges_description}
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label
                        htmlFor="charges_start_date"
                        className="text-sm font-medium"
                    >
                        Start Date
                    </label>
                    <Input
                        id="charges_start_date"
                        type="date"
                        value={form.data.charges_start_date}
                        onChange={(e) =>
                            form.setData("charges_start_date", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.charges_start_date)}
                    />
                    {form.errors.charges_start_date ? (
                        <p className="text-sm text-red-600">
                            {form.errors.charges_start_date}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="charges_end_date"
                        className="text-sm font-medium"
                    >
                        End Date
                    </label>
                    <Input
                        id="charges_end_date"
                        type="date"
                        value={form.data.charges_end_date}
                        onChange={(e) =>
                            form.setData("charges_end_date", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.charges_end_date)}
                    />
                    {form.errors.charges_end_date ? (
                        <p className="text-sm text-red-600">
                            {form.errors.charges_end_date}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label
                        htmlFor="charges_status"
                        className="text-sm font-medium"
                    >
                        Status
                    </label>
                    <select
                        id="charges_status"
                        className={selectClassName}
                        value={form.data.charges_status}
                        onChange={(e) =>
                            form.setData(
                                "charges_status",
                                e.target.value as ChargeFormData["charges_status"],
                            )
                        }
                        aria-invalid={Boolean(form.errors.charges_status)}
                    >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                    {form.errors.charges_status ? (
                        <p className="text-sm text-red-600">
                            {form.errors.charges_status}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label htmlFor="sort_order" className="text-sm font-medium">
                        Sort Order
                    </label>
                    <Input
                        id="sort_order"
                        type="number"
                        min="1"
                        max="127"
                        value={form.data.sort_order}
                        onChange={(e) =>
                            form.setData("sort_order", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.sort_order)}
                    />
                    {form.errors.sort_order ? (
                        <p className="text-sm text-red-600">
                            {form.errors.sort_order}
                        </p>
                    ) : null}
                </div>
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

