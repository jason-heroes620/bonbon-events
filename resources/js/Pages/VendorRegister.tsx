import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import type { Category } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import type { FormEvent } from "react";

type VendorRegisterFormData = {
    email: string;
    password: string;
    password_confirmation: string;
    vendor_name: string;
    vendor_contact_person: string;
    vendor_contact_no: string;
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
};

type VendorRegisterProps = {
    categories: Pick<Category, "category_id" | "category_name">[];
};

const textareaClassName =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export default function VendorRegister({ categories }: VendorRegisterProps) {
    const form = useForm<VendorRegisterFormData>({
        email: "",
        password: "",
        password_confirmation: "",
        vendor_name: "",
        vendor_contact_person: "",
        vendor_contact_no: "",
        business_registration_no: "",
        business_description: "",
        category: [],
        social_medias: {
            instagram: "",
            facebook: "",
            youtube: "",
            tiktok: "",
            xiaohongshu: "",
        },
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post("/vendor/register");
    };

    return (
        <GuestLayout>
            <Head title="Vendor Registration" />

            <div className="mb-6 space-y-1">
                <h1 className="text-lg font-semibold">Vendor Registration</h1>
                <p className="text-sm text-gray-600">
                    Create your vendor account to participate in events.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email
                    </label>
                    <Input
                        id="email"
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData("email", e.target.value)}
                        aria-invalid={Boolean(form.errors.email)}
                    />
                    {form.errors.email ? (
                        <p className="text-sm text-red-600">
                            {form.errors.email}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-4">
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
                            aria-invalid={Boolean(form.errors.password)}
                        />
                        {form.errors.password ? (
                            <p className="text-sm text-red-600">
                                {form.errors.password}
                            </p>
                        ) : null}
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
                        />
                    </div>
                </div>

                <hr />

                <div className="space-y-2">
                    <label
                        htmlFor="vendor_name"
                        className="text-sm font-medium"
                    >
                        Organization / Brand Name
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

                <div className="space-y-2 flex w-full flex-col">
                    <label className="text-sm font-medium">Categories</label>
                    <MultiSelect
                        options={categories.map((c) => ({
                            label: c.category_name,
                            value: c.category_id,
                        }))}
                        onValueChange={(value) =>
                            form.setData("category", value)
                        }
                        defaultValue={form.data.category}
                        placeholder="Select categories"
                        variant="default"
                        maxSelected={categories.length}
                        maxCount={3}
                        aria-invalid={Boolean(form.errors.category)}
                    />
                    {form.errors.category ? (
                        <p className="text-sm text-red-600">
                            {form.errors.category}
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
                        className={textareaClassName}
                        rows={4}
                        value={form.data.business_description}
                        onChange={(e) =>
                            form.setData("business_description", e.target.value)
                        }
                        aria-invalid={Boolean(form.errors.business_description)}
                    />
                    {form.errors.business_description ? (
                        <p className="text-sm text-red-600">
                            {form.errors.business_description}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-3">
                    <div className="text-sm font-medium">Social Medias</div>

                    <div className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <label
                                htmlFor="social_instagram"
                                className="text-sm"
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
                                className="text-sm"
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
                            <label htmlFor="social_youtube" className="text-sm">
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
                            <label htmlFor="social_tiktok" className="text-sm">
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
                                className="text-sm"
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

                <div className="flex items-center justify-between pt-2">
                    <Link
                        href="/login"
                        className="text-sm text-gray-600 underline"
                    >
                        Already have an account?
                    </Link>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.visit("/")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Register
                        </Button>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
