import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Booth, BoothType } from "@/types";
import type { FormEvent } from "react";

type BoothFormData = {
    booth_type_id: string;
    booth_name: string;
    booth_description: string;
    is_active: boolean;
};

type BoothFormProps = {
    boothTypes: BoothType[];
    booth?: Booth;
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function BoothForm({
    boothTypes,
    booth,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: BoothFormProps) {
    const form = useForm<BoothFormData>({
        booth_type_id: booth?.booth_type_id ?? "",
        booth_name: booth?.booth_name ?? "",
        booth_description: booth?.booth_description ?? "",
        is_active: booth?.is_active ?? true,
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
                <label htmlFor="booth_type_id" className="text-sm font-medium">
                    Booth Type
                </label>
                <select
                    id="booth_type_id"
                    className={selectClassName}
                    value={form.data.booth_type_id}
                    onChange={(e) =>
                        form.setData("booth_type_id", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.booth_type_id)}
                >
                    <option value="" disabled>
                        Select a booth type
                    </option>
                    {boothTypes.map((type) => (
                        <option
                            key={type.booth_type_id}
                            value={type.booth_type_id}
                        >
                            {type.booth_type_name}
                        </option>
                    ))}
                </select>
                {form.errors.booth_type_id ? (
                    <p className="text-sm text-red-600">
                        {form.errors.booth_type_id}
                    </p>
                ) : null}
            </div>

            <div className="space-y-2">
                <label htmlFor="booth_name" className="text-sm font-medium">
                    Name
                </label>
                <Input
                    id="booth_name"
                    value={form.data.booth_name}
                    onChange={(e) => form.setData("booth_name", e.target.value)}
                    aria-invalid={Boolean(form.errors.booth_name)}
                />
                {form.errors.booth_name ? (
                    <p className="text-sm text-red-600">
                        {form.errors.booth_name}
                    </p>
                ) : null}
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="booth_description"
                    className="text-sm font-medium"
                >
                    Description
                </label>
                <textarea
                    id="booth_description"
                    className={textareaClassName}
                    rows={4}
                    value={form.data.booth_description}
                    onChange={(e) =>
                        form.setData("booth_description", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.booth_description)}
                />
                {form.errors.booth_description ? (
                    <p className="text-sm text-red-600">
                        {form.errors.booth_description}
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
