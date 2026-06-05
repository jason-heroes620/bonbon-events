import React, { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import type { Event } from "@/types";
import "../../css/home.css";
import { usePage, Link, useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

const Home = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showParticipateModal, setShowParticipateModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] =
        useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [participateData, setParticipateData] = useState({
        participants: 1,
        no_of_booths: 1,
        requirements: "",
        plug: false,
    });
    const [participateErrors, setParticipateErrors] = useState<
        Record<string, string>
    >({});
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
    });
    const passwordForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const userMenuRef = useRef<HTMLDivElement | null>(null);

    const page = usePage();
    const authUser = (page.props as any)?.auth?.user as
        | { user_id: string; name?: string; role?: string }
        | undefined;
    const authVendor = (page.props as any)?.auth?.vendor as
        | { vendor_id: string }
        | null
        | undefined;

    const isLoggedIn = useMemo(() => Boolean(authUser), [authUser]);

    useEffect(() => {
        axios.get("/events-list").then((response) => {
            setEvents(response.data);
        });
    }, []);

    useEffect(() => {
        if (!showUserMenu) return;

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (!userMenuRef.current) return;
            if (!userMenuRef.current.contains(target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", onMouseDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
        };
    }, [showUserMenu]);

    const monthShortUpper = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
    ];

    const toMonthDay = (dateValue?: string | null) => {
        if (!dateValue) return null;
        const dateOnly = dateValue.split("T")[0];
        const [y, m, d] = dateOnly.split("-").map((v) => Number(v));
        if (!y || !m || !d) return null;
        const month = monthShortUpper[m - 1];
        if (!month) return null;
        return { month, day: d };
    };

    const handleEventClick = async (event: Event) => {
        if (!isLoggedIn) {
            window.alert("You are not logged in.");
            setShowLoginModal(true);
            return;
        }

        if (authUser?.role !== "vendor") {
            window.alert("Only vendor accounts can participate in events.");
            return;
        }

        if (!authVendor?.vendor_id) {
            window.alert("Vendor profile not found. Please log in again.");
            return;
        }

        // check account, if not account, if not, direct to profile page to update
        const response = await axios
            .get("/vendor/profile/bank-account")
            .then((res) => res.data);
        if (!response.data) {
            window.alert("Bank account not set. Please update your profile.");
            window.location.href = "/vendor/profile";
            setShowParticipateModal(false);
            return;
        }

        setSelectedEvent(event);
        setParticipateErrors({});
        setParticipateData({
            participants: 1,
            no_of_booths: 1,
            requirements: "",
            plug: false,
        });
        setShowParticipateModal(true);
    };

    const submitParticipation = async () => {
        if (!selectedEvent) return;

        if (!isLoggedIn) {
            window.alert("You are not logged in.");
            setShowLoginModal(true);
            return;
        }

        if (authUser?.role !== "vendor") {
            window.alert("Only vendor accounts can participate in events.");
            return;
        }

        if (!authVendor?.vendor_id) {
            window.alert("Vendor profile not found. Please log in again.");
            return;
        }

        const confirmed = window.confirm(
            `Confirm participate in "${selectedEvent.event_name}"?`,
        );
        if (!confirmed) return;

        setParticipateErrors({});

        try {
            await axios.post(`/events/${selectedEvent.event_id}/participate`, {
                user_id: authUser.user_id,
                vendor_id: authVendor.vendor_id,
                participants: participateData.participants,
                no_of_booths: participateData.no_of_booths,
                requirements:
                    participateData.requirements.trim() === ""
                        ? null
                        : participateData.requirements.trim(),
                plug: participateData.plug,
            });

            setShowParticipateModal(false);
            setSelectedEvent(null);
            toast.success("Participation submitted.");
        } catch (err: any) {
            const status = err?.response?.status;
            const message =
                err?.response?.data?.message ??
                "Failed to participate in this event.";

            if (status === 422 && err?.response?.data?.errors) {
                const serverErrors = err.response.data.errors as Record<
                    string,
                    string[] | string
                >;
                const normalized: Record<string, string> = {};
                for (const [key, value] of Object.entries(serverErrors)) {
                    normalized[key] = Array.isArray(value)
                        ? value.join(" ")
                        : String(value);
                }
                setParticipateErrors(normalized);
                return;
            }

            if (status === 409) {
                window.alert(message);
                return;
            }

            window.alert(message);
        }
    };

    const handleLogin = async () => {
        // check email format is correct before post request
        if (!data.email) {
            window.alert("Please enter your email.");
            return;
        }

        if (!data.password) {
            window.alert("Please enter your password.");
            return;
        }

        post("/vendor/login", {
            onSuccess: () => {
                setShowLoginModal(false);
            },
            onError: (errors) => {
                window.alert(errors.password ?? errors.email);
            },
            onFinish: () => {
                reset("password");
            },
        });
    };

    const handleLogout = async () => {
        const confirmed = window.confirm("Confirm logout?");
        if (!confirmed) {
            return;
        }

        post("/vendor/logout", {
            onSuccess: () => {
                setShowLoginModal(false);
                toast.success("Logout successful.");
                reset();
            },
            onError: (errors) => {
                window.alert(errors.password ?? errors.email);
            },
            onFinish: () => {
                reset();
            },
        });
        return;
    };

    return (
        <div>
            <Toaster />
            <div className="topbar">
                <a className="logo" href="#">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-row items-center gap-2">
                            <img
                                src="bonbon-logo.png"
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
                            src="what-the-pets.png"
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
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white shadow-md z-50">
                                        <Link
                                            href="/vendor/profile"
                                            className="block w-full px-3 py-2 text-sm hover:bg-muted/50"
                                            onClick={() =>
                                                setShowUserMenu(false)
                                            }
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            type="button"
                                            className="block w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
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

            <div className="hero">
                <div className="decor d1"></div>
                <div className="decor d2"></div>
                <div className="eyebrow fu d1t">🐾 Upcoming Pet Events</div>
                <h1 className="fu d2t">
                    Life's better when<br className="br"></br>your pet is{" "}
                    <em>happy</em>
                </h1>
                <p className="sub fu d3t">
                    Discover exclusive grooming days, adoption drives, pet
                    markets, and wellness events — curated with love by BonBon ×
                    What the Pets.
                </p>
                <div className="actions fu d4t">
                    <Link href="/vendor/register" className="btn btn-p">
                        🐾 Join BonBon — It's Free
                    </Link>
                    <a href="#chips" className="btn btn-s">
                        Browse events ↓
                    </a>
                </div>
            </div>

            <div className="stats">
                <div className="stat">
                    <div className="stat-n">8,000+</div>
                    <div className="stat-l">Pet Parents</div>
                </div>
                <div className="stat">
                    <div className="stat-n">60+</div>
                    <div className="stat-l">Partner Brands</div>
                </div>

                <div className="stat">
                    <div className="stat-n">220+</div>
                    <div className="stat-l">Members And Counting</div>
                </div>
            </div>

            <div className="filter-bar" id="chips">
                <h2>Upcoming Events🐾</h2>
                <div className="chips">
                    {/* show a list of upcoming events by calling events api for active events */}
                    <div className="flex flex-wrap gap-4">
                        {events.length > 0
                            ? events.map((event) => (
                                  <div key={event.event_id} className="m-2">
                                      {(() => {
                                          const md = toMonthDay(
                                              (event as any)?.event_start_date,
                                          );
                                          return (
                                              <button
                                                  type="button"
                                                  onClick={() =>
                                                      handleEventClick(event)
                                                  }
                                                  className="cursor-pointer"
                                              >
                                                  <div className="event-thumb">
                                                      {event.event_image !==
                                                      null ? (
                                                          <img
                                                              src={
                                                                  event.event_image
                                                              }
                                                              alt={
                                                                  event.event_name
                                                              }
                                                              className="chip-img"
                                                          />
                                                      ) : (
                                                          <img
                                                              src="/empty_image.png"
                                                              alt=""
                                                              className="chip-img"
                                                          />
                                                      )}

                                                      {md ? (
                                                          <div className="event-date-badge">
                                                              <div className="event-date-month">
                                                                  {md.month}
                                                              </div>
                                                              <div className="event-date-day">
                                                                  {md.day}
                                                              </div>
                                                          </div>
                                                      ) : null}
                                                  </div>
                                              </button>
                                          );
                                      })()}
                                  </div>
                              ))
                            : "No upcoming events yet."}
                    </div>
                </div>
            </div>

            <div className="grid" id="grid"></div>

            {/* <div className="nl">
                <h2>Never miss a tail-wagging event</h2>
                <p>
                    Get rewarded for spoiling your pet. Join 8,000+ pet parents
                    in the BonBon community.
                </p>
                <div className="nl-form">
                    <input
                        className="nl-input"
                        type="email"
                        placeholder="your@email.com"
                        id="nlemail"
                    />
                    <button className="nl-btn" id="nlbtn">
                        Subscribe
                    </button>
                </div>
            </div> */}

            <div className="footer">
                <div className="flex flex-col justify-start gap-4">
                    <div className="flex gap-2">
                        <a href="" className="text-white font-medium">
                            Terms of Service
                        </a>
                    </div>
                    <p className="text-white text-sm">
                        © {new Date().getFullYear()} BonBon × What the Pets. All
                        rights reserved.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-white font-medium text-sm">
                        Contact:
                    </span>
                    <span className="text-sm text-white">
                        Accessible Experiences Sdn Bhd (1496618­A)
                    </span>
                    <span className="text-white text-sm font-medium">
                        hello@bonbon.com.my
                    </span>
                    <span className="text-white text-sm font-medium">
                        012-7456 785
                    </span>
                </div>
            </div>

            <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <DialogContent className="flex flex-col sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                        <DialogDescription>
                            Please log in to participate in an event.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label
                                htmlFor="Email"
                                className="text-sm font-medium"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="Email"
                                className="w-full rounded-md border border-gray-300 p-2"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                            />
                            {errors.email ? (
                                <p className="text-sm text-red-600">
                                    {errors.email}
                                </p>
                            ) : null}
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="Password"
                                className="text-sm font-medium"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="Password"
                                className="w-full rounded-md border border-gray-300 p-2"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                            />
                            {errors.password ? (
                                <p className="text-sm text-red-600">
                                    {errors.password}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <div className="flex items-center mr-2">
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
                                    type="submit"
                                    onClick={() => handleLogin()}
                                    className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm text-white"
                                    disabled={processing}
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
                                htmlFor="CurrentPassword"
                                className="text-sm font-medium"
                            >
                                Current Password
                            </label>
                            <input
                                type="password"
                                id="CurrentPassword"
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
                                htmlFor="NewPassword"
                                className="text-sm font-medium"
                            >
                                New Password
                            </label>
                            <input
                                type="password"
                                id="NewPassword"
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
                                htmlFor="ConfirmNewPassword"
                                className="text-sm font-medium"
                            >
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="ConfirmNewPassword"
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

            <Dialog
                open={showParticipateModal}
                onOpenChange={(open) => {
                    setShowParticipateModal(open);
                    if (!open) {
                        setSelectedEvent(null);
                        setParticipateErrors({});
                    }
                }}
            >
                <DialogContent className="flex flex-col sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Participate in Event</DialogTitle>
                        <DialogDescription className="flex justify-center ">
                            <div className="w-full md:w-1/2 border rounded-lg p-4">
                                <span className="font-bold">Event:</span>{" "}
                                {selectedEvent?.event_name ?? ""}
                                <br />
                                <span className="font-bold">Date:</span>{" "}
                                {selectedEvent?.event_date ?? ""}
                                <br />
                                <span className="font-bold">Time:</span>{" "}
                                {selectedEvent?.event_time ?? ""}
                                <br />
                                <span className="font-bold">Venue:</span>{" "}
                                {selectedEvent?.venue ?? ""}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1">
                                <label
                                    htmlFor="participants"
                                    className="text-sm font-medium"
                                >
                                    No. of Participants
                                </label>
                                <input
                                    id="participants"
                                    type="number"
                                    min={1}
                                    className="w-full rounded-md border border-gray-300 p-2"
                                    value={participateData.participants}
                                    onChange={(e) =>
                                        setParticipateData((prev) => ({
                                            ...prev,
                                            participants: Number(
                                                e.target.value,
                                            ),
                                        }))
                                    }
                                />
                                {participateErrors.participants ? (
                                    <p className="text-sm text-red-600">
                                        {participateErrors.participants}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="no_of_booths"
                                    className="text-sm font-medium"
                                >
                                    No. of Booths
                                </label>
                                <input
                                    id="no_of_booths"
                                    type="number"
                                    min={1}
                                    className="w-full rounded-md border border-gray-300 p-2"
                                    value={participateData.no_of_booths}
                                    onChange={(e) =>
                                        setParticipateData((prev) => ({
                                            ...prev,
                                            no_of_booths: Number(
                                                e.target.value,
                                            ),
                                        }))
                                    }
                                />
                                {participateErrors.no_of_booths ? (
                                    <p className="text-sm text-red-600">
                                        {participateErrors.no_of_booths}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="requirements"
                                className="text-sm font-medium"
                            >
                                Requirements
                            </label>
                            <textarea
                                id="requirements"
                                className="w-full rounded-md border border-gray-300 p-2"
                                rows={4}
                                value={participateData.requirements}
                                onChange={(e) =>
                                    setParticipateData((prev) => ({
                                        ...prev,
                                        requirements: e.target.value,
                                    }))
                                }
                            />
                            {participateErrors.requirements ? (
                                <p className="text-sm text-red-600">
                                    {participateErrors.requirements}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="plug"
                                type="checkbox"
                                checked={participateData.plug}
                                onChange={(e) =>
                                    setParticipateData((prev) => ({
                                        ...prev,
                                        plug: e.target.checked,
                                    }))
                                }
                            />
                            <label htmlFor="plug" className="text-sm">
                                Require Plug Point
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowParticipateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={submitParticipation}>
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Home;
