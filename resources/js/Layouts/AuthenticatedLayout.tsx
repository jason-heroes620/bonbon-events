import Dropdown from "@/components/Dropdown";
import { useForm, usePage } from "@inertiajs/react";
import { useMemo, useState, type ReactNode } from "react";
import type { User } from "@/types";
import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const AuthenticatedLayout = ({
    header,
    children,
}: {
    header: ReactNode;
    children: ReactNode;
}) => {
    const page = usePage();
    const authUser = (page.props as any)?.auth?.user as User | undefined;
    const userName = authUser?.name ?? "User";

    const [showChangePassword, setShowChangePassword] = useState(false);

    const passwordForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const strongPasswordOk = useMemo(() => {
        const password = passwordForm.data.password ?? "";
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);
        return password.length >= 8 && hasLower && hasUpper && hasNumber && hasSymbol;
    }, [passwordForm.data.password]);

    const canSubmitPassword = useMemo(() => {
        return (
            passwordForm.data.current_password.trim() !== "" &&
            strongPasswordOk &&
            passwordForm.data.password_confirmation === passwordForm.data.password &&
            !passwordForm.processing
        );
    }, [
        passwordForm.data.current_password,
        passwordForm.data.password,
        passwordForm.data.password_confirmation,
        passwordForm.processing,
        strongPasswordOk,
    ]);

    const submitPasswordChange = () => {
        if (!canSubmitPassword) return;

        passwordForm.put("/password", {
            preserveScroll: true,
            onSuccess: () => {
                setShowChangePassword(false);
                passwordForm.reset();
            },
        });
    };

    return (
        <SidebarProvider className="sidebar-accent-brand">
            <AppSidebar />
            <Toaster />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
                    <SidebarTrigger className="-ml-1" />
                    {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
                    {/* We can add breadcrumbs here later */}
                    <div className="ml-auto">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <Button type="button" variant="outline">
                                    {userName}
                                </Button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48">
                                <button
                                    type="button"
                                    className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                    onClick={() => setShowChangePassword(true)}
                                >
                                    Change password
                                </button>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-4">
                    {children}
                </div>
            </SidebarInset>

            <Dialog
                open={showChangePassword}
                onOpenChange={(open) => {
                    setShowChangePassword(open);
                    if (!open) passwordForm.reset();
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and a new strong
                            password.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label
                                htmlFor="current_password"
                                className="text-sm font-medium"
                            >
                                Old Password
                            </label>
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        "current_password",
                                        e.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    passwordForm.errors.current_password,
                                )}
                            />
                            {passwordForm.errors.current_password ? (
                                <p className="text-sm text-red-600">
                                    {passwordForm.errors.current_password}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium"
                            >
                                New Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        "password",
                                        e.target.value,
                                    )
                                }
                                aria-invalid={Boolean(passwordForm.errors.password)}
                            />
                            {!strongPasswordOk &&
                            passwordForm.data.password.trim() !== "" ? (
                                <p className="text-sm text-red-600">
                                    Must include uppercase, lowercase, number,
                                    symbol, and be at least 8 characters.
                                </p>
                            ) : null}
                            {passwordForm.errors.password ? (
                                <p className="text-sm text-red-600">
                                    {passwordForm.errors.password}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password_confirmation"
                                className="text-sm font-medium"
                            >
                                Confirm New Password
                            </label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    passwordForm.errors.password_confirmation,
                                )}
                            />
                            {passwordForm.data.password_confirmation !== "" &&
                            passwordForm.data.password_confirmation !==
                                passwordForm.data.password ? (
                                <p className="text-sm text-red-600">
                                    Passwords do not match.
                                </p>
                            ) : null}
                            {passwordForm.errors.password_confirmation ? (
                                <p className="text-sm text-red-600">
                                    {passwordForm.errors.password_confirmation}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowChangePassword(false)}
                            disabled={passwordForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitPasswordChange}
                            disabled={!canSubmitPassword}
                        >
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
};

export default AuthenticatedLayout;
