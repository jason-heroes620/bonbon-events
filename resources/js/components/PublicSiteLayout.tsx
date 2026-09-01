import "../../css/home.css";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type AuthUser = {
    user_id: string;
    name?: string;
    role?: string;
};

type PublicSiteLayoutRenderProps = {
    authUser?: AuthUser;
    isLoggedIn: boolean;
    openLoginModal: () => void;
};

type PublicSiteLayoutProps = {
    children: ReactNode | ((props: PublicSiteLayoutRenderProps) => ReactNode);
    loginDescription?: string;
};

export default function PublicSiteLayout({
    children,
    loginDescription = "Please log in to continue.",
}: PublicSiteLayoutProps) {
    const page = usePage();
    const authUser = (page.props as any)?.auth?.user as AuthUser | undefined;
    const isLoggedIn = useMemo(() => Boolean(authUser), [authUser]);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] =
        useState(false);

    const userMenuRef = useRef<HTMLDivElement | null>(null);

    const loginForm = useForm({
        email: "",
        password: "",
    });
    const passwordForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    useEffect(() => {
        if (!showUserMenu) return;

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target || !userMenuRef.current) return;
            if (!userMenuRef.current.contains(target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", onMouseDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
        };
    }, [showUserMenu]);

    const handleLogin = () => {
        if (!loginForm.data.email) {
            window.alert("Please enter your email.");
            return;
        }
        if (!loginForm.data.password) {
            window.alert("Please enter your password.");
            return;
        }

        loginForm.post("/vendor/login", {
            preserveScroll: true,
            onSuccess: () => {
                setShowLoginModal(false);
                toast.success("Login successful.");
            },
            onError: (errors) => {
                window.alert(errors.password ?? errors.email);
            },
            onFinish: () => {
                loginForm.reset("password");
            },
        });
    };

    const handleLogout = () => {
        const confirmed = window.confirm("Confirm logout?");
        if (!confirmed) return;

        router.post(
            "/vendor/logout",
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Logout successful.");
                },
            },
        );
    };

    const content =
        typeof children === "function"
            ? children({
                  authUser,
                  isLoggedIn,
                  openLoginModal: () => setShowLoginModal(true),
              })
            : children;

    return (
        <div className="flex flex-col h-screen">
            <div className="topbar">
                <a className="logo" href="/">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-row items-center gap-2">
                            <img
                                src="/bonbon-logo.png"
                                alt=""
                                className="w-12 h-12"
                            />
                            <p className="brand-name">BonBon</p>
                        </div>
                    </div>
                    <div>
                        <span className="brand-name font-bold"> X </span>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                        <img
                            src="/what-the-pets.png"
                            alt=""
                            className="w-12 h-12"
                        />
                        <p className="brand-name">What the Pets</p>
                    </div>
                </a>

                <div className="nav">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-4">
                            <span>Hello, {authUser?.name ?? "Vendor"}!</span>
                            <div className="relative" ref={userMenuRef}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setShowUserMenu((prev) => !prev)
                                    }
                                >
                                    Account
                                </Button>
                                {showUserMenu ? (
                                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-white shadow-md">
                                        <Link
                                            href="/vendor/profile"
                                            className="block w-full px-3 py-2 text-sm hover:bg-muted/50"
                                            onClick={() =>
                                                setShowUserMenu(false)
                                            }
                                        >
                                            Profile
                                        </Link>
                                        {authUser?.role === "vendor" ? (
                                            <>
                                                <Link
                                                    href="/vendor/applications"
                                                    className="block w-full px-3 py-2 text-sm hover:bg-muted/50"
                                                    onClick={() =>
                                                        setShowUserMenu(false)
                                                    }
                                                >
                                                    Applications
                                                </Link>
                                                <Link
                                                    href="/vendor/orders"
                                                    className="block w-full px-3 py-2 text-sm hover:bg-muted/50"
                                                    onClick={() =>
                                                        setShowUserMenu(false)
                                                    }
                                                >
                                                    Orders
                                                </Link>
                                                <Link
                                                    href="/vendor/sales"
                                                    className="block w-full px-3 py-2 text-sm hover:bg-muted/50"
                                                    onClick={() =>
                                                        setShowUserMenu(false)
                                                    }
                                                >
                                                    Sales
                                                </Link>
                                            </>
                                        ) : null}
                                        <button
                                            type="button"
                                            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                setShowChangePasswordModal(
                                                    true,
                                                );
                                            }}
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                            <Button type="button" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setShowLoginModal(true)}
                            >
                                Log in
                            </button>
                            <Link href="/vendor/register" className="cta">
                                Join for free
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            <div className="grow">{content}</div>

            <div className="footer">
                <div className="flex flex-col justify-start gap-4">
                    <div className="flex gap-2">
                        <a
                            href="/terms-of-service"
                            className="text-white font-medium"
                        >
                            Terms of Service
                        </a>
                    </div>
                    <p className="text-sm text-white">
                        © {new Date().getFullYear()} BonBon × What the Pets. All
                        rights reserved.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">
                        Contact:
                    </span>
                    <span className="text-sm text-white">
                        Accessible Experiences Sdn Bhd (1496618-A)
                    </span>
                    <span className="text-sm font-medium text-white">
                        hello@bonbon.com.my
                    </span>
                    <span className="text-sm font-medium text-white">
                        012-7456 750
                    </span>
                </div>
            </div>

            <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <DialogContent className="flex flex-col sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                        <DialogDescription>
                            {loginDescription}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label
                                htmlFor="public-site-email"
                                className="text-sm font-medium"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="public-site-email"
                                className="w-full rounded-md border border-gray-300 p-2"
                                value={loginForm.data.email}
                                onChange={(e) =>
                                    loginForm.setData("email", e.target.value)
                                }
                            />
                            {loginForm.errors.email ? (
                                <p className="text-sm text-red-600">
                                    {loginForm.errors.email}
                                </p>
                            ) : null}
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="public-site-password"
                                className="text-sm font-medium"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="public-site-password"
                                className="w-full rounded-md border border-gray-300 p-2"
                                value={loginForm.data.password}
                                onChange={(e) =>
                                    loginForm.setData(
                                        "password",
                                        e.target.value,
                                    )
                                }
                            />
                            {loginForm.errors.password ? (
                                <p className="text-sm text-red-600">
                                    {loginForm.errors.password}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <div className="mr-2 flex items-center">
                            <span className="mr-2">
                                Don't have an account?{" "}
                            </span>
                            <Link
                                className="text-black underline"
                                href="/vendor/register"
                            >
                                Create
                            </Link>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <Link
                                href="/vendor/forgot-password"
                                className="text-sm text-muted-foreground hover:underline"
                                onClick={() => setShowLoginModal(false)}
                            >
                                Forgot password?
                            </Link>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
                                    onClick={() => setShowLoginModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogin}
                                    className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm text-white"
                                    disabled={loginForm.processing}
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showChangePasswordModal}
                onOpenChange={(open) => {
                    setShowChangePasswordModal(open);
                    if (!open) {
                        passwordForm.reset(
                            "current_password",
                            "password",
                            "password_confirmation",
                        );
                        passwordForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="flex flex-col sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and a new password.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label
                                htmlFor="public-site-current-password"
                                className="text-sm font-medium"
                            >
                                Current Password
                            </label>
                            <input
                                type="password"
                                id="public-site-current-password"
                                className="w-full rounded-md border border-gray-300 p-2"
                                value={passwordForm.data.current_password}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        "current_password",
                                        e.target.value,
                                    )
                                }
                            />
                            {passwordForm.errors.current_password ? (
                                <p className="text-sm text-red-600">
                                    {passwordForm.errors.current_password}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="public-site-new-password"
                                className="text-sm font-medium"
                            >
                                New Password
                            </label>
                            <input
                                type="password"
                                id="public-site-new-password"
                                className="w-full rounded-md border border-gray-300 p-2"
                                value={passwordForm.data.password}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        "password",
                                        e.target.value,
                                    )
                                }
                            />
                            {passwordForm.errors.password ? (
                                <p className="text-sm text-red-600">
                                    {passwordForm.errors.password}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="public-site-confirm-password"
                                className="text-sm font-medium"
                            >
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="public-site-confirm-password"
                                className="w-full rounded-md border border-gray-300 p-2"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                            />
                            {passwordForm.errors.password_confirmation ? (
                                <p className="text-sm text-red-600">
                                    {passwordForm.errors.password_confirmation}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowChangePasswordModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={passwordForm.processing}
                            onClick={() => {
                                passwordForm.put("/password", {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setShowChangePasswordModal(false);
                                        toast.success("Password updated.");
                                    },
                                });
                            }}
                        >
                            Update Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
