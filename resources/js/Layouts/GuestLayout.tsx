import ApplicationLogo from "@/components/ApplicationLogo";
import { Link } from "@inertiajs/react";

import type { ReactNode } from "react";

type GuestLayoutProps = {
    children: ReactNode;
};

const GuestLayout = ({ children }: GuestLayoutProps) => {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 sm:justify-center p-10">
            <div>
                <Link href="/">
                    <ApplicationLogo width={60} height={60} />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md max-w-lg sm:rounded-lg">
                {children}
            </div>
        </div>
    );
};

export default GuestLayout;
