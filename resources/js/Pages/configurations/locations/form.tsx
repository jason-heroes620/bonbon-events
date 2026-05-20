import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Location } from "@/types";
import type { FormEvent } from "react";

type LocationFormData = {
    location_name: string;
    location_description: string;
    is_active: boolean;
};

type LocationFormProps = {
    location?: Location;
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function LocationForm({
    location,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: LocationFormProps) {
    const form = useForm<LocationFormData>({
        location_name: location?.location_name ?? "",
        location_description: location?.location_description ?? "",
        is_active: (location?.is_active ?? true) === true,
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
                <label htmlFor="location_name" className="text-sm font-medium">
                    Name
                </label>
                <Input
                    id="location_name"
                    value={form.data.location_name}
                    onChange={(e) =>
                        form.setData("location_name", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.location_name)}
                />
                {form.errors.location_name ? (
                    <p className="text-sm text-red-600">
                        {form.errors.location_name}
                    </p>
                ) : null}
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="location_description"
                    className="text-sm font-medium"
                >
                    Description
                </label>
                <textarea
                    id="location_description"
                    className={textareaClassName}
                    rows={4}
                    value={form.data.location_description}
                    onChange={(e) =>
                        form.setData("location_description", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.location_description)}
                />
                {form.errors.location_description ? (
                    <p className="text-sm text-red-600">
                        {form.errors.location_description}
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
