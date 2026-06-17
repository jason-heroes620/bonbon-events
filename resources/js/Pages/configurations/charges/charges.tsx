import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Charge } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type ChargesPageProps = {
    charges: Paginated<Charge>;
    filters: {
        search?: string;
    };
};

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links?.length) return null;

    return (
        <div className="flex items-center gap-2">
            {links
                .filter((l) => l.label !== "...")
                .map((link, idx) => (
                    <Link
                        key={`${link.label}-${idx}`}
                        href={link.url ?? ""}
                        preserveScroll
                        className={cn(
                            buttonVariants({
                                variant: link.active ? "default" : "outline",
                                size: "sm",
                            }),
                            !link.url && "pointer-events-none opacity-50",
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
        </div>
    );
}

export default function ChargesIndex({ charges, filters }: ChargesPageProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const didMountRef = useRef(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/charges",
                { search: search.trim() === "" ? undefined : search },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        if (charges.total === 0) return "No charges";
        return `Showing ${charges.from ?? 0}–${charges.to ?? 0} of ${charges.total}`;
    }, [charges.from, charges.to, charges.total]);

    const handleDelete = (charge: Charge) => {
        const confirmed = window.confirm(
            `Delete charge "${charge.charges_name}"?`,
        );
        if (!confirmed) return;

        router.delete(`/charges/${charge.charges_id}`, {
            preserveScroll: true,
        });
    };

    const formatRate = (charge: Charge) => {
        const n =
            typeof charge.charges_rate === "number"
                ? charge.charges_rate
                : Number(charge.charges_rate);
        const rate = Number.isFinite(n)
            ? n.toFixed(2)
            : String(charge.charges_rate);
        if (charge.charges_type === "P") return `${rate}%`;
        return rate;
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Charges</h2>}
        >
            <Head title="Charges" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Charges</h1>
                        <p className="text-sm text-muted-foreground">{stats}</p>
                    </div>

                    <Link href="/charges/create" className={buttonVariants()}>
                        Create Charge
                    </Link>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full max-w-md items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search charges..."
                        />
                        {search.trim() !== "" ? (
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setSearch("")}
                            >
                                Clear
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-lg border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Rate
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Start Date
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        End Date
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Sort
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {charges.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No charges found
                                        </td>
                                    </tr>
                                ) : (
                                    charges.data.map((charge) => (
                                        <tr
                                            key={charge.charges_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {charge.charges_name}
                                                </div>
                                                {charge.charges_description ? (
                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            charge.charges_description
                                                        }
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3">
                                                {charge.charges_type === "F"
                                                    ? "Fixed"
                                                    : "Percentage"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatRate(charge)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {charge.charges_start_date
                                                    ? format(
                                                          new Date(
                                                              charge.charges_start_date,
                                                          ),
                                                          "dd MMM, y",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {charge.charges_end_date
                                                    ? format(
                                                          new Date(
                                                              charge.charges_end_date,
                                                          ),
                                                          "dd MMM, y",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {charge.charges_status
                                                    ? "Active"
                                                    : "Inactive"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {charge.sort_order ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Link
                                                        href={`/charges/${charge.charges_id}`}
                                                        className={cn(
                                                            buttonVariants({
                                                                variant:
                                                                    "outline",
                                                                size: "sm",
                                                            }),
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <Pagination links={charges.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
