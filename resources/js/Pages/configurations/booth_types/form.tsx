import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BoothType } from "@/types";
import type { FormEvent } from "react";

type BoothTypeFormData = {
    booth_type_name: string;
    is_active: boolean;
};

type BoothTypeFormProps = {
    boothType?: BoothType;
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

export default function BoothTypeForm({
    boothType,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: BoothTypeFormProps) {
    const form = useForm<BoothTypeFormData>({
        booth_type_name: boothType?.booth_type_name ?? "",
        is_active: boothType?.is_active ?? true,
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
                    htmlFor="booth_type_name"
                    className="text-sm font-medium"
                >
                    Name
                </label>
                <Input
                    id="booth_type_name"
                    value={form.data.booth_type_name}
                    onChange={(e) =>
                        form.setData("booth_type_name", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.booth_type_name)}
                />
                {form.errors.booth_type_name ? (
                    <p className="text-sm text-red-600">
                        {form.errors.booth_type_name}
                    </p>
                ) : null}
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={form.data.is_active}
                    onChange={(e) =>
                        form.setData("is_active", e.target.checked)
                    }
                />
                <label htmlFor="is_active" className="text-sm">
                    Active
                </label>
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
