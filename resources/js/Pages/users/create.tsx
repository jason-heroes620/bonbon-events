import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";

type CreateUserFormData = {
    name: string;
    email: string;
    role: string;
    password: string;
    password_confirmation: string;
};

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function CreateUser() {
    const form = useForm<CreateUserFormData>({
        name: "",
        email: "",
        role: "user",
        password: "",
        password_confirmation: "",
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post("/users");
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Users</h2>}
        >
            <Head title="Create User" />

            <div className="max-w-3xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">Create User</h1>
                        <p className="text-sm text-muted-foreground">
                            New users are inactive until their email is
                            verified.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="name"
                                className="text-sm font-medium"
                            >
                                Name
                            </label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData("name", e.target.value)
                                }
                                aria-invalid={Boolean(form.errors.name)}
                            />
                            {form.errors.name ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.name}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData("email", e.target.value)
                                }
                                aria-invalid={Boolean(form.errors.email)}
                            />
                            {form.errors.email ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.email}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="role"
                                className="text-sm font-medium"
                            >
                                Role
                            </label>
                            <select
                                id="role"
                                className={selectClassName}
                                value={form.data.role}
                                onChange={(e) =>
                                    form.setData("role", e.target.value)
                                }
                                aria-invalid={Boolean(form.errors.role)}
                            >
                                <option value="user">user</option>
                                <option value="vendor">vendor</option>
                                <option value="admin">admin</option>
                            </select>
                            {form.errors.role ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.role}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium"
                            >
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData("password", e.target.value)
                                }
                                autoComplete="new-password"
                                aria-invalid={Boolean(form.errors.password)}
                            />
                            {form.errors.password ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.password}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Min 12 characters, with upper & lower case,
                                    a number, and a symbol.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password_confirmation"
                                className="text-sm font-medium"
                            >
                                Confirm Password
                            </label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(e) =>
                                    form.setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="flex justify-end items-center gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.visit("/users")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Create
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
