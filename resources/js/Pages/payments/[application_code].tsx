import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from "@inertiajs/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Application = {
    application_id: string;
    application_code: string;
    application_status: string;
};

type Invoice = {
    invoice_id: string;
    invoice_no: string;
    invoice_status: string;
    invoice_amount: number | string;
    invoice_date: string;
} | null;

type Order = {
    order_id: string;
    order_no: string;
    application_id: string;
    application_code: string;
    total_price: number | string;
    discount_price: number | string;
    is_paid: boolean;
    created_at?: string;
} | null;

type OrderItem = {
    order_item_id: string;
    quantity: number;
    price: number | string;
    item_description: string;
};

type PaymentsPageProps = {
    application: Application;
    order: Order;
    invoice: Invoice;
    items: OrderItem[];
    ipay88: {
        enabled: boolean;
    };
};

export default function PaymentsShow({
    application,
    order,
    invoice,
    items,
    ipay88,
}: PaymentsPageProps) {
    const formatAmount = (value: number | string) => {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(value);
    };

    return (
        <GuestLayout>
            <Head title={`Payment ${application.application_code}`} />

            <div className="space-y-4">
                <div>
                    <h1 className="text-lg font-semibold">Make Payment</h1>
                    <div className="text-sm text-muted-foreground">
                        Application {application.application_code}
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Order No
                        </div>
                        <div className="text-sm font-medium">
                            {order?.order_no ?? "-"}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Total Amount
                        </div>
                        <div className="text-sm font-medium">
                            RM {order ? formatAmount(order.total_price) : "-"}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Payment Status
                        </div>
                        <div>
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                    order?.is_paid
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800",
                                )}
                            >
                                {order?.is_paid ? "Paid" : "Unpaid"}
                            </span>
                        </div>
                    </div>
                </div>

                {items.length ? (
                    <div className="rounded-lg border bg-white">
                        <div className="border-b px-4 py-3">
                            <div className="text-sm font-medium">
                                Order Items
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Price (RM)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr
                                            key={item.order_item_id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                {item.item_description}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {formatAmount(item.price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}

                {order?.discount_price && (
                    <div className="rounded-lg border bg-white p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Discount
                            </div>
                            <div className="text-sm font-medium">
                                RM {order?.discount_price ?? "-"}
                            </div>
                        </div>
                    </div>
                )}
                {/* <div className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Invoice
                        </div>
                        <div className="text-sm font-medium">
                            {invoice?.invoice_no ?? "-"}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Invoice Status
                        </div>
                        <div className="text-sm font-medium">
                            {invoice?.invoice_status ?? "-"}
                        </div>
                    </div>
                </div> */}

                <div className="flex justify-end gap-2">
                    <a
                        href="/"
                        className={buttonVariants({ variant: "outline" })}
                    >
                        Back
                    </a>

                    <Button
                        type="button"
                        disabled={
                            !ipay88.enabled ||
                            !order ||
                            order.is_paid ||
                            application.application_status !== "approved"
                        }
                        onClick={() => {
                            window.location.href = `/payments/${application.application_code}/ipay88`;
                        }}
                    >
                        Make Payment
                    </Button>
                </div>
            </div>
        </GuestLayout>
    );
}
