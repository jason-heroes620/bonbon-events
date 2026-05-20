import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types";
import type { FormEvent } from "react";

type CategoryFormData = {
    category_name: string;
    category_description: string;
    is_active: boolean;
};

type CategoryFormProps = {
    category?: Category;
    submitUrl: string;
    method: "post" | "put";
    submitLabel: string;
    cancelUrl: string;
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function CategoryForm({
    category,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: CategoryFormProps) {
    const form = useForm<CategoryFormData>({
        category_name: category?.category_name ?? "",
        category_description: category?.category_description ?? "",
        is_active: category?.is_active ?? true,
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
                <label htmlFor="category_name" className="text-sm font-medium">
                    Name
                </label>
                <Input
                    id="category_name"
                    value={form.data.category_name}
                    required={true}
                    maxLength={255}
                    onChange={(e) =>
                        form.setData("category_name", e.target.value)
                    }
                    aria-invalid={Boolean(form.errors.category_name)}
                />
                {form.errors.category_name ? (
                    <p className="text-sm text-red-600">
                        {form.errors.category_name}
                    </p>
                ) : null}
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="category_description"
                    className="text-sm font-medium"
                >
                    Description
                </label>
                <textarea
                    id="category_description"
                    className={textareaClassName}
                    rows={4}
                    value={form.data.category_description}
                    onChange={(e) =>
                        form.setData("category_description", e.target.value)
                    }
                    required={false}
                    maxLength={255}
                    aria-invalid={Boolean(form.errors.category_description)}
                />
                {form.errors.category_description ? (
                    <p className="text-sm text-red-600">
                        {form.errors.category_description}
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
