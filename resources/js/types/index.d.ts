export type User = {
    user_id: string;
    name: string;
    email: string;
    is_active: boolean;
    role: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type Category = {
    category_id: string;
    category_name: string;
    category_description: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

export type Location = {
    location_id: string;
    location_name: string;
    location_description: string | null;
    is_active: boolean | null;
    created_at?: string;
    updated_at?: string;
};

export type BoothType = {
    booth_type_id: string;
    booth_type_name: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

export type Booth = {
    booth_id: string;
    booth_type_id: string;
    booth_name: string;
    booth_description: string | null;
    is_active: boolean;
    booth_type?: BoothType;
    boothType?: BoothType;
    created_at?: string;
    updated_at?: string;
};

export type EventBooth = {
    booth_id: string;
    booth_price: number | string;
};

export type Event = {
    event_id: string;
    event_name: string;
    event_description: string | null;
    event_date: string;
    event_time: string;
    location_id: string;
    venue: string | null;
    event_booth_layout?: string | null;
    event_image?: string | null;
    event_start_date: string;
    event_end_date: string;
    require_deposit: boolean;
    deposit_id: string;
    is_active: boolean;
    location?: Location;
    booths?: EventBooth[];
    created_at?: string;
    updated_at?: string;
};

export type ApplicationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled";

export type ApplicationEvent = {
    application_event_id: string;
    application_id: string;
    event_id: string;
    participants: number;
    no_of_booths: number;
    requirements: string | null;
    plug: boolean;
    application_status: ApplicationStatus;
    event?: Event;
    created_at?: string;
    updated_at?: string;
};

export type Application = {
    application_id: string;
    user_id?: string | null;
    vendor_id?: string | null;
    application_code: string;
    social_medias?: any;
    application_status: ApplicationStatus;
    events?: ApplicationEvent[];
    vendor?: Vendor;
    order?: Order | null;
    created_at?: string | Date;
    updated_at?: string;
};

export type Deposit = {
    deposit_id: string;
    deposit_description: string;
    deposit_amount: number | string;
    deposit_start_date: string;
    deposit_end_date: string | null;
    deposit_status: "active" | "inactive";
    created_at?: string;
    updated_at?: string;
};

export type Charge = {
    charges_id: string;
    charges_name: string;
    charges_type: "F" | "P";
    charges_rate: number | string;
    charges_description: string | null;
    charges_start_date: string;
    charges_end_date: string | null;
    charges_status: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
};

export type Vendor = {
    vendor_id: string;
    user_id: string;
    vendor_name: string;
    vendor_email: string;
    vendor_contact_person: string;
    vendor_contact_no: string;
    business_name: string;
    business_registration_no: string;
    business_description: string;
    social_medias: any;
    category: string[] | string;
    vendor_bank_name?: string;
    vendor_bank_account_no?: string;
    vendor_bank_account_name?: string;
    is_active: boolean;
    user?: Pick<User, "user_id" | "name" | "email">;
    created_at?: string;
    updated_at?: string;
};

export type Order = {
    order_id: string;
    order_no: string;
    total_price: number | string;
    discount_price: number | string;
    is_paid: boolean;
    created_at?: string;
};
