import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InvoiceNo = {
    invoice_no_id: string;
    prefix: string;
    invoice_no: string;
    suffix: string;
    length: number;
    created_at?: string;
    updated_at?: string;
};

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

type InvoiceNosPageProps = {
    invoiceNos: Paginated<InvoiceNo>;
    filters: {
        search?: string;
    };
};

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links?.length) return null;

    return (
        <nav className="flex flex-wrap gap-1">
            {links.map((link) => {
                const commonClassName = cn(
                    "inline-flex items-center rounded-md border px-3 py-1 text-sm",
                    link.active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted",
                    !link.url && "opacity-50 pointer-events-none",
                );

                if (!link.url) {
                    return (
                        <span
                            key={link.label}
                            className={commonClassName}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={link.label}
                        href={link.url}
                        className={commonClassName}
                        preserveScroll
                        preserveState
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}

export default function InvoiceNosIndex({
    invoiceNos,
    filters,
}: InvoiceNosPageProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const didMountRef = useRef(false);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                "/invoice-nos",
                { search: search.trim() === "" ? undefined : search },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        if (invoiceNos.total === 0) return "No invoice no";
        return `Showing ${invoiceNos.from ?? 0}–${invoiceNos.to ?? 0} of ${invoiceNos.total}`;
    }, [invoiceNos.from, invoiceNos.to, invoiceNos.total]);

    const handleDelete = (invoiceNo: InvoiceNo) => {
        const confirmed = window.confirm(
            `Delete invoice no "${invoiceNo.prefix}${invoiceNo.invoice_no}${invoiceNo.suffix}"?`,
        );
        if (!confirmed) return;

        router.delete(`/invoice-nos/${invoiceNo.invoice_no_id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold">Invoice No</h2>}
        >
            <Head title="Invoice No" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Invoice No</h1>
                        <p className="text-sm text-muted-foreground">{stats}</p>
                    </div>

                    <Link
                        href="/invoice-nos/create"
                        className={buttonVariants()}
                    >
                        Create Invoice No
                    </Link>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full max-w-md items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search invoice no..."
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
                                        Prefix
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Invoice No
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Suffix
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Length
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceNos.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No invoice no found.
                                        </td>
                                    </tr>
                                ) : (
                                    invoiceNos.data.map((invoiceNo) => (
                                        <tr
                                            key={invoiceNo.invoice_no_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {invoiceNo.prefix}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {invoiceNo.invoice_no}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {invoiceNo.suffix}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {invoiceNo.length}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/invoice-nos/${invoiceNo.invoice_no_id}`}
                                                        className={buttonVariants(
                                                            {
                                                                variant:
                                                                    "outline",
                                                                size: "sm",
                                                            },
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
                        <Pagination links={invoiceNos.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
