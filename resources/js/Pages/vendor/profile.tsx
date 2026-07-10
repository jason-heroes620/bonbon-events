import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import type { Category, Vendor } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import type { FormEvent } from "react";
import { toast, Toaster } from "sonner";

type VendorProfileProps = {
    vendor: Vendor;
    categories: Pick<Category, "category_id" | "category_name">[];
};

type VendorProfileFormData = {
    vendor_name: string;
    vendor_email: string;
    vendor_contact_person: string;
    vendor_contact_no: string;
    business_name: string;
    business_registration_no: string;
    business_description: string;
    category: string[];
    social_medias: {
        instagram: string;
        facebook: string;
        youtube: string;
        tiktok: string;
        xiaohongshu: string;
    };
    vendor_bank_name: string;
    vendor_bank_account_no: string;
    vendor_bank_account_name: string;
    vendor_status: string;
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const normalizeCategory = (value: Vendor["category"]): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export default function VendorProfile({
    vendor,
    categories,
}: VendorProfileProps) {
    const social = (vendor.social_medias ?? {}) as Partial<
        VendorProfileFormData["social_medias"]
    >;

    const form = useForm<VendorProfileFormData>({
        vendor_name: vendor.vendor_name ?? "",
        vendor_email: vendor.vendor_email ?? "",
        vendor_contact_person: vendor.vendor_contact_person ?? "",
        vendor_contact_no: vendor.vendor_contact_no ?? "",
        business_name: vendor.business_name ?? "",
        business_registration_no: vendor.business_registration_no ?? "",
        business_description: vendor.business_description ?? "",
        category: normalizeCategory(vendor.category),
        social_medias: {
            instagram: social.instagram ?? "",
            facebook: social.facebook ?? "",
            youtube: social.youtube ?? "",
            tiktok: social.tiktok ?? "",
            xiaohongshu: social.xiaohongshu ?? "",
        },
        vendor_bank_name: vendor.vendor_bank_name ?? "",
        vendor_bank_account_no: vendor.vendor_bank_account_no ?? "",
        vendor_bank_account_name: vendor.vendor_bank_account_name ?? "",
        vendor_status: vendor.vendor_status ?? "",
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put("/vendor/profile", {
            onSuccess: () => {
                toast.success("Profile updated successfully");
            },
            preserveScroll: true,
        });
    };

    return (
        <GuestLayout>
            <Head title="Profile" />
            <Toaster />
            <div className="mb-6 space-y-1">
                <h1 className="text-lg font-semibold">Profile</h1>
                <p className="text-sm text-gray-600">
                    Update your vendor information.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <label
                        htmlFor="vendor_name"
                        className="text-sm font-medium"
                    >
                        Vendor Name
                    </label>
                    <Input
                        id="vendor_name"
                        value={form.data.vendor_name}
                        onChange={(e) =>
                            form.setData("vendor_name", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.vendor_name)}
                    />
                    {form.errors.vendor_name ? (
                        <p className="text-sm text-red-600">
                            {form.errors.vendor_name}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="vendor_email"
                        className="text-sm font-medium"
                    >
                        Email
                    </label>
                    <Input
                        id="vendor_email"
                        type="email"
                        value={form.data.vendor_email}
                        onChange={(e) =>
                            form.setData("vendor_email", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.vendor_email)}
                        disabled
                    />
                    {form.errors.vendor_email ? (
                        <p className="text-sm text-red-600">
                            {form.errors.vendor_email}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="vendor_contact_person"
                            className="text-sm font-medium"
                        >
                            Contact Person
                        </label>
                        <Input
                            id="vendor_contact_person"
                            value={form.data.vendor_contact_person}
                            onChange={(e) =>
                                form.setData(
                                    "vendor_contact_person",
                                    e.target.value,
                                )
                            }
                            aria-invalid={Boolean(
                                form.errors.vendor_contact_person,
                            )}
                        />
                        {form.errors.vendor_contact_person ? (
                            <p className="text-sm text-red-600">
                                {form.errors.vendor_contact_person}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="vendor_contact_no"
                            className="text-sm font-medium"
                        >
                            Contact No
                        </label>
                        <Input
                            id="vendor_contact_no"
                            value={form.data.vendor_contact_no}
                            onChange={(e) =>
                                form.setData(
                                    "vendor_contact_no",
                                    e.target.value,
                                )
                            }
                            aria-invalid={Boolean(
                                form.errors.vendor_contact_no,
                            )}
                        />
                        {form.errors.vendor_contact_no ? (
                            <p className="text-sm text-red-600">
                                {form.errors.vendor_contact_no}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="business_name"
                        className="text-sm font-medium"
                    >
                        Company Name
                    </label>
                    <Input
                        id="business_name"
                        value={form.data.business_name}
                        onChange={(e) =>
                            form.setData("business_name", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.business_name)}
                    />
                    {form.errors.business_name ? (
                        <p className="text-sm text-red-600">
                            {form.errors.business_name}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="business_registration_no"
                        className="text-sm font-medium"
                    >
                        Business Registration No
                    </label>
                    <Input
                        id="business_registration_no"
                        value={form.data.business_registration_no}
                        onChange={(e) =>
                            form.setData(
                                "business_registration_no",
                                e.target.value,
                            )
                        }
                        aria-invalid={Boolean(
                            form.errors.business_registration_no,
                        )}
                    />
                    {form.errors.business_registration_no ? (
                        <p className="text-sm text-red-600">
                            {form.errors.business_registration_no}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="business_description"
                        className="text-sm font-medium"
                    >
                        Business Description
                    </label>
                    <textarea
                        id="business_description"
                        rows={4}
                        className={textareaClassName}
                        value={form.data.business_description}
                        onChange={(e) =>
                            form.setData("business_description", e.target.value)
                        }
                    />
                    {form.errors.business_description ? (
                        <p className="text-sm text-red-600">
                            {form.errors.business_description}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <MultiSelect
                        options={categories.map((c) => ({
                            value: c.category_id,
                            label: c.category_name,
                        }))}
                        value={form.data.category}
                        onValueChange={(value) =>
                            form.setData("category", value)
                        }
                        placeholder="Select categories"
                        maxSelected={categories.length || 1}
                    />
                    {form.errors.category ? (
                        <p className="text-sm text-red-600">
                            {form.errors.category as any}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium">Social Media</div>
                    <div className="flex gap-3 flex-col">
                        <div className="space-y-1">
                            <label
                                htmlFor="social_instagram"
                                className="text-xs text-muted-foreground"
                            >
                                Instagram
                            </label>
                            <Input
                                id="social_instagram"
                                value={form.data.social_medias.instagram}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        instagram: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="social_facebook"
                                className="text-xs text-muted-foreground"
                            >
                                Facebook
                            </label>
                            <Input
                                id="social_facebook"
                                value={form.data.social_medias.facebook}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        facebook: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="social_youtube"
                                className="text-xs text-muted-foreground"
                            >
                                YouTube
                            </label>
                            <Input
                                id="social_youtube"
                                value={form.data.social_medias.youtube}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        youtube: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="social_tiktok"
                                className="text-xs text-muted-foreground"
                            >
                                TikTok
                            </label>
                            <Input
                                id="social_tiktok"
                                value={form.data.social_medias.tiktok}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        tiktok: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <label
                                htmlFor="social_xiaohongshu"
                                className="text-xs text-muted-foreground"
                            >
                                Xiaohongshu
                            </label>
                            <Input
                                id="social_xiaohongshu"
                                value={form.data.social_medias.xiaohongshu}
                                onChange={(e) =>
                                    form.setData("social_medias", {
                                        ...form.data.social_medias,
                                        xiaohongshu: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
                <hr />
                <div className="space-y-2">
                    <div className="text-sm font-medium">
                        Bank Details
                        <p className="text-xs text-muted-foreground">
                            (for deposit refund purpose)
                        </p>
                    </div>
                    <div className="flex gap-3 flex-col">
                        <div className="space-y-1">
                            <label
                                htmlFor="vendor_bank_name"
                                className="text-xs text-muted-foreground"
                            >
                                Bank Name
                            </label>
                            <Input
                                id="vendor_bank_name"
                                value={form.data.vendor_bank_name}
                                onChange={(e) =>
                                    form.setData(
                                        "vendor_bank_name",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="vendor_bank_account_no"
                                className="text-xs text-muted-foreground"
                            >
                                Account No
                            </label>
                            <Input
                                id="vendor_bank_account_no"
                                value={form.data.vendor_bank_account_no}
                                onChange={(e) =>
                                    form.setData(
                                        "vendor_bank_account_no",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="vendor_bank_account_name"
                                className="text-xs text-muted-foreground"
                            >
                                Account Name
                            </label>
                            <Input
                                id="vendor_bank_account_name"
                                value={form.data.vendor_bank_account_name}
                                onChange={(e) =>
                                    form.setData(
                                        "vendor_bank_account_name",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                    <Link href="/" className="text-sm text-muted-foreground">
                        Back to Home
                    </Link>
                    <Button type="submit" disabled={form.processing}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
