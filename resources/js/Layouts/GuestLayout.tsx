import ApplicationLogo from "@/components/ApplicationLogo";
import { Link } from "@inertiajs/react";

import type { ReactNode } from "react";

type GuestLayoutProps = {
    children: ReactNode;
    className?: string;
};

const GuestLayout = ({ children, className }: GuestLayoutProps) => {
    return (
        <div
            className={`flex min-h-screen flex-col items-center bg-gray-100 sm:justify-center pt-6 p-4 ${className}`}
        >
            <div>
                <Link href="/">
                    <ApplicationLogo width={60} height={60} />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-4 py-4 shadow-md md:max-w-3xl sm:rounded-lg">
                {children}
            </div>
        </div>
    );
};

export default GuestLayout;
