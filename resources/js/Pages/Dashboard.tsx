import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "date-fns";

type UpcomingEvent = {
    event_id: string;
    event_name: string;
    event_start_date: string | null;
    event_end_date: string | null;
    total_booths: number;
    occupied_booths: number;
    unoccupied_booths: number;
};

type DashboardProps = {
    pendingApplicationsCount: number;
    upcomingEvents: UpcomingEvent[];
    currentMonthRevenue: number | string;
    currentMonthLabel: string;
    currency: string;
};

export default function Dashboard() {
    const page = usePage();
    const {
        pendingApplicationsCount,
        upcomingEvents,
        currentMonthRevenue,
        currentMonthLabel,
        currency,
    } = page.props as unknown as DashboardProps;

    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n))
            return n.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        return String(value);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border bg-white p-4">
                            <div className="text-sm text-muted-foreground">
                                Pending Applications
                            </div>
                            <div className="mt-1 text-3xl font-semibold">
                                {pendingApplicationsCount}
                            </div>
                            <div className="mt-3">
                                <Link
                                    href="/applications"
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    })}
                                >
                                    View applications
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white p-4">
                            <div className="text-sm text-muted-foreground">
                                Revenue ({currentMonthLabel})
                            </div>
                            <div className="mt-1 text-3xl font-semibold">
                                {currency} {formatAmount(currentMonthRevenue)}
                            </div>
                            <div className="mt-3">
                                <Link
                                    href="/invoices"
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    })}
                                >
                                    View invoices
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white p-4">
                            <div className="text-sm text-muted-foreground">
                                Upcoming Events
                            </div>
                            <div className="mt-1 text-3xl font-semibold">
                                {upcomingEvents?.length ?? 0}
                            </div>
                            <div className="mt-3">
                                <Link
                                    href="/events"
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    })}
                                >
                                    View events
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-lg border bg-white">
                        <div className="border-b px-4 py-3 text-sm font-semibold">
                            Upcoming Events Booth Summary
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="text-left">
                                        <th className="px-4 py-2">Event</th>
                                        <th className="px-4 py-2">Start</th>
                                        <th className="px-4 py-2">Total</th>
                                        <th className="px-4 py-2">Occupied</th>
                                        <th className="px-4 py-2">
                                            Unoccupied
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(upcomingEvents ?? []).length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-muted-foreground"
                                            >
                                                No upcoming events.
                                            </td>
                                        </tr>
                                    ) : (
                                        (upcomingEvents ?? []).map((e) => (
                                            <tr
                                                key={e.event_id}
                                                className="border-t"
                                            >
                                                <td className="px-4 py-2 font-medium">
                                                    {e.event_name}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {e.event_start_date
                                                        ? formatDate(
                                                              e.event_start_date,
                                                              "yyyy-MM-dd",
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {e.total_booths}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {e.occupied_booths}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {e.unoccupied_booths}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
