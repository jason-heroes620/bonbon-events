import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";

type InvoiceNoFormData = {
    prefix: string;
    invoice_no: string;
    suffix: string;
    length: number;
};

type InvoiceNoFormProps = {
    invoiceNo?: {
        invoice_no_id: string;
        prefix: string;
        invoice_no: string;
        suffix: string;
        length: number;
    };
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function InvoiceNoForm({
    invoiceNo,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: InvoiceNoFormProps) {
    const form = useForm<InvoiceNoFormData>({
        prefix: invoiceNo?.prefix ?? "INV",
        invoice_no: invoiceNo?.invoice_no ?? "0",
        suffix: invoiceNo?.suffix ?? "0",
        length: invoiceNo?.length ?? 6,
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
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="prefix" className="text-sm font-medium">
                        Prefix
                    </label>
                    <Input
                        id="prefix"
                        value={form.data.prefix}
                        onChange={(e) => form.setData("prefix", e.target.value)}
                        aria-invalid={Boolean(form.errors.prefix)}
                    />
                    {form.errors.prefix ? (
                        <p className="text-sm text-red-600">
                            {form.errors.prefix}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label htmlFor="suffix" className="text-sm font-medium">
                        Suffix
                    </label>
                    <Input
                        id="suffix"
                        value={form.data.suffix}
                        onChange={(e) => form.setData("suffix", e.target.value)}
                        aria-invalid={Boolean(form.errors.suffix)}
                    />
                    {form.errors.suffix ? (
                        <p className="text-sm text-red-600">
                            {form.errors.suffix}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="invoice_no" className="text-sm font-medium">
                        Invoice No
                    </label>
                    <Input
                        id="invoice_no"
                        value={form.data.invoice_no}
                        onChange={(e) =>
                            form.setData("invoice_no", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.invoice_no)}
                    />
                    {form.errors.invoice_no ? (
                        <p className="text-sm text-red-600">
                            {form.errors.invoice_no}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label htmlFor="length" className="text-sm font-medium">
                        Length
                    </label>
                    <Input
                        id="length"
                        value={form.data.length}
                        type="number"
                        onChange={(e) =>
                            form.setData("length", Number(e.target.value))
                        }
                        aria-invalid={Boolean(form.errors.length)}
                    />
                    {form.errors.length ? (
                        <p className="text-sm text-red-600">
                            {form.errors.length}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <div className="text-sm font-medium">Preview</div>
                    <div className={selectClassName}>
                        {`${form.data.prefix}` +
                            String(form.data.invoice_no).padStart(
                                form.data.length ?? 6,
                                form.data.suffix,
                            )}
                    </div>
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
