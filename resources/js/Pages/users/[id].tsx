import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import type { User } from "@/types";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditUserProps = {
    user: User;
};

type UserFormData = {
    name: string;
    email: string;
    role: string;
    is_active: boolean;
};

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function EditUser({ user }: EditUserProps) {
    const isVerified = user.email_verified_at != null;
    const [isSendingVerification, setIsSendingVerification] = useState(false);

    const form = useForm<UserFormData>({
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "user",
        is_active: Boolean(user.is_active),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        form.put(`/users/${user.user_id}`);
    };

    const sendVerificationEmail = () => {
        setIsSendingVerification(true);
        router.post(
            `/users/${user.user_id}/send-verification-email`,
            undefined,
            {
                preserveScroll: true,
                onFinish: () => setIsSendingVerification(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Users</h2>}
        >
            <Head title={`Edit User: ${user.name}`} />

            <div className="max-w-3xl">
                <div className="rounded-lg border bg-white p-6">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold">Edit User</h1>
                        <p className="text-sm text-muted-foreground">
                            Email verified: {isVerified ? "Yes" : "No"}
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
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Changing email will mark the user as
                                    unverified and inactive.
                                </p>
                            )}
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

                        <div className="flex items-center gap-2">
                            <input
                                id="is_active"
                                type="checkbox"
                                className="h-4 w-4 rounded border-input"
                                checked={form.data.is_active}
                                disabled={!isVerified}
                                onChange={(e) =>
                                    form.setData("is_active", e.target.checked)
                                }
                            />
                            <label htmlFor="is_active" className="text-sm">
                                Active
                            </label>
                            {!isVerified ? (
                                <span className="text-xs text-muted-foreground">
                                    Requires verified email
                                </span>
                            ) : null}
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
                                Save
                            </Button>
                            {!isVerified ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={sendVerificationEmail}
                                    disabled={isSendingVerification}
                                >
                                    Send Verification Email
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
