import PublicSiteLayout from "@/components/PublicSiteLayout";
import { Head } from "@inertiajs/react";

const sections = [
    {
        title: "1. Acceptance of Terms",
        content:
            "By registering for or participating in any event hosted on this platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the services or participate in the events.",
    },
    {
        title: "2. Registration & Eligibility",
        content:
            "Participants must provide accurate, complete, and current information during the registration process. Age limits, regional restrictions, or skill prerequisites may apply depending on the specific event guidelines.",
    },
    {
        title: "3. Code of Conduct",
        content:
            "We strictly enforce a respectful environment. Harassment, toxic behavior, cheating, exploitation of bugs, or collusion will result in immediate disqualification and a potential permanent ban from future events.",
    },
    {
        title: "4. Media & Broadcasting Rights",
        content:
            "By participating, you grant the event organizers the right to record, stream, photograph, or otherwise broadcast your gameplay, team names, logos, and player profiles for promotional purposes.",
    },
    {
        title: "5. Cancellation & Refunds",
        content:
            "Event timelines are subject to change due to technical issues, server maintenance, or unforeseen circumstances. Paid ticket entries are generally non-refundable unless an event is permanently cancelled by the host without rescheduling.",
    },
    {
        title: "6. Limitation of Liability",
        content:
            "The platform and its organizers are not liable for any technical failures on the participant's end (e.g., internet disconnects, hardware issues), or any indirect damages resulting from your participation in the event.",
    },
];

const TermsOfService = () => {
    return (
        <PublicSiteLayout>
            <Head title="Terms of Service" />
            {/* <div>
                <h2 className="font-semibold">Terms of Service</h2>
            </div> */}
            <div className="container mx-auto md:max-w-3xl px-4 py-8">
                <div className="space-y-4">
                    <div>
                        <div className="text-sm text-muted-foreground">
                            Last updated: 1 June 2026
                        </div>
                    </div>
                    <div>
                        {/* Content */}
                        <div className="px-6 py-8 sm:px-10 space-y-8">
                            <p className="leading-relaxed">
                                Please read these terms and conditions carefully
                                before participating in our events. They contain
                                important information regarding your legal
                                rights, remedies, and obligations.
                            </p>

                            <div className="space-y-6">
                                <div className="flex w-full pb-6">
                                    <p className="text-justify">
                                        <p className="text-center">
                                            <strong>
                                                Terms &amp; Conditions: BonBon /
                                                What The Pets Events &amp;
                                                Markets
                                            </strong>
                                        </p>
                                        <p className="text-center">&nbsp;</p>

                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            1.⁠ ⁠Eligibility
                                        </p>
                                        <p>&nbsp;</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                This agreement is between BonBon
                                                / What The Pets (“Organiser”)
                                                and the participating vendor
                                                (“Vendor”).
                                            </li>
                                            <li>
                                                Vendors must be legally
                                                authorised to operate their
                                                business and sell the products
                                                they are showcasing.⁠
                                            </li>
                                            <li>
                                                Vendors must submit a detailed
                                                product description, which must
                                                be approved by the Organiser
                                                prior to contract finalisation,
                                                to ensure alignment with the
                                                event theme and objectives.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            2.⁠ ⁠Event Details
                                        </p>
                                        <p>&nbsp;</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                Event name, location, operating
                                                hours, set-up hours, and
                                                tear-down hours will be
                                                communicated separately via the
                                                event information sheet,
                                                confirmation email, or invoice.
                                            </li>
                                            <li>
                                                Vendors agree to comply with the
                                                event details as communicated by
                                                the Organiser.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            3.⁠ ⁠Booking &amp; Payment
                                        </p>
                                        <p>&nbsp;</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                ⁠Payment Method for Display Fee:
                                                Online payment gateway or bank
                                                transfer (details provided upon
                                                confirmation within the
                                                invoice).
                                            </li>
                                            <li>
                                                ⁠Payment Terms: Full payment for
                                                the retail display fee is due
                                                within the timeframe stated in
                                                the confirmation email or
                                                invoice.
                                            </li>
                                            <li>
                                                If payment is not received by
                                                the deadline, the Organiser
                                                reserves the right to cancel the
                                                booking and reallocate the space
                                                without further notice or
                                                liability to the Vendor.
                                            </li>
                                            <li>
                                                ⁠Payment of fees and deposit
                                                constitutes acceptance of these
                                                Terms &amp; Conditions.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            4.⁠ ⁠Vendor Responsibilities
                                        </p>
                                        <p>&nbsp;</p>
                                        <p>Products &amp; Pricing</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                Products must be in line with
                                                the event theme and guidelines.
                                                The Organiser reserves the right
                                                to request the immediate removal
                                                of any product deemed
                                                non-compliant, illegal, unsafe,
                                                or counterfeit.
                                            </li>
                                            <li>
                                                Vendors are responsible for
                                                obtaining any necessary permits
                                                or licenses for their products
                                                if required.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p>Retail Display &amp; Set-up</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                The Vendor’s display (including
                                                all stock, signage, and
                                                personnel) must not exceed the
                                                boundaries of the allocated
                                                space and must not obstruct
                                                walkways, fire exits, or
                                                adjacent Vendor spaces.
                                            </li>
                                            <li>
                                                Any promotional materials and
                                                marketing tools should be
                                                provided by the Vendor.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p>Sales &amp; Customer Service</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                ⁠The Vendor will manage all
                                                customer interactions and is
                                                solely responsible for all sales
                                                transactions, product quality,
                                                returns, and compliance with all
                                                applicable consumer protection
                                                laws, including accurate
                                                pricing.
                                            </li>
                                            <li>
                                                Vendor must comply with all
                                                applicable laws and regulations
                                                regarding product sales.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p>Operating Hours &amp; Attendance</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                Vendors must operate their booth
                                                for the full event operating
                                                hours as communicated by the
                                                Organiser.
                                            </li>
                                            <li>
                                                Late setup, early closure, or
                                                no-show is a breach of these
                                                Terms &amp; Conditions.
                                            </li>
                                            <li>
                                                ⁠Penalties may apply for late
                                                setup, early closure, or
                                                no-shows and may be recovered in
                                                accordance with the Deposit
                                                clause under Breakdown &amp;
                                                Clean-up.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p>Breakdown &amp; Clean-up</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                ⁠A refundable deposit amount (as
                                                stated in the invoice or event
                                                information sheet) is required.
                                            </li>
                                            <li>
                                                Vendors are responsible for
                                                removing all stock, display
                                                materials, and any packaging or
                                                rubbish from their booth area
                                                after the event.
                                            </li>
                                            <li>
                                                The event team will inspect the
                                                space after breakdown to ensure
                                                it is left clean and in its
                                                original condition.
                                            </li>
                                            <li>
                                                ⁠If the space meets these
                                                conditions, the full deposit
                                                will be refunded within 5–7
                                                business days after event
                                                completion.
                                            </li>
                                            <li>
                                                ⁠If the area is not left clean
                                                and in its original condition,
                                                the deposit may be partially or
                                                fully retained to cover cleaning
                                                services.
                                            </li>
                                            <li>
                                                The deposit may be partially or
                                                fully forfeited in the event of
                                                late setup, early closure,
                                                no-show, or any other breach of
                                                these Terms &amp; Conditions.
                                            </li>
                                            <li>
                                                The Organiser reserves the right
                                                to apply the deposit toward any
                                                applicable penalty arising from
                                                such breach.
                                            </li>
                                            <li>
                                                If the penalty exceeds the
                                                deposit amount, the Vendor
                                                agrees to pay the balance owing
                                                upon request.
                                            </li>
                                            <li>
                                                Refunds will be processed via
                                                the method stated in the
                                                confirmation email or invoice,
                                                and vendors will be notified
                                                once issued.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            5.⁠ ⁠Organiser Responsibilities
                                        </p>
                                        <p>&nbsp;</p>
                                        <p>Event Space &amp; Infrastructure</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                Organiser will provide a
                                                pre-defined space for the
                                                Vendor’s chosen retail display
                                                configuration.
                                            </li>
                                            <li>
                                                Organiser will ensure basic
                                                infrastructure as stated in the
                                                event information sheet.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p>Security &amp; Insurance</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                While the venue owner may
                                                provide a general secure
                                                environment, the Organiser is
                                                not responsible for the security
                                                of the Vendor’s products or
                                                property. Vendors are
                                                responsible for securing their
                                                own belongings at all times.
                                            </li>
                                            <li>
                                                Organiser may obtain event
                                                insurance covering property
                                                damage and public liability.
                                                Vendors are encouraged to obtain
                                                any additional insurance
                                                necessary for their products and
                                                liability.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p>Marketing &amp; Promotion</p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                Organiser may execute marketing
                                                and promotional activities for
                                                the event.
                                            </li>
                                            <li>
                                                The Organiser makes no
                                                guarantee, warranty, or
                                                representation regarding visitor
                                                numbers or sales performance.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            6.⁠ ⁠Cancellation Policy
                                        </p>
                                        <p>&nbsp;</p>
                                        <p>
                                            In case of Force Majeure (including
                                            but not limited to acts of God, war,
                                            pandemic, government order, or venue
                                            closure), the Organiser reserves the
                                            right to cancel or postpone the
                                            event. In such cases, the Organiser
                                            may offer the Vendor a full credit
                                            for a future event or a prorated
                                            refund based on unrecoverable costs,
                                            at the Organiser’s sole discretion.
                                        </p>
                                        <ul className="list-disc ml-6">
                                            <li>
                                                ⁠Vendor cancellations must be
                                                received in writing within the
                                                timeframe stated in the event
                                                information sheet to be eligible
                                                for any refund.
                                            </li>
                                            <li>
                                                Cancellations received after
                                                this timeframe will not be
                                                eligible for a refund.
                                            </li>
                                            <li>
                                                ⁠In exceptional circumstances
                                                and with documented
                                                justification (e.g.,
                                                hospitalisation), the Organiser
                                                may consider offering a prorated
                                                refund at its discretion.
                                            </li>
                                        </ul>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            7.⁠ ⁠Indemnity
                                        </p>
                                        <p>&nbsp;</p>
                                        <p>
                                            The Vendor agrees to indemnify, hold
                                            harmless, and waive any claim
                                            against the Organiser and the venue
                                            owner for any loss, damage, injury,
                                            or liability arising from the
                                            Vendor’s participation in the event.
                                        </p>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            8.⁠ ⁠Governing Law &amp; Dispute
                                            Resolution
                                        </p>
                                        <p>&nbsp;</p>
                                        <p>
                                            These Terms &amp; Conditions shall
                                            be governed by and construed in
                                            accordance with the laws of
                                            Malaysia. Any dispute arising out of
                                            or in connection with these Terms
                                            &amp; Conditions shall be settled by
                                            arbitration in Malaysia.
                                        </p>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">
                                            9.⁠ ⁠Entire Agreement
                                        </p>
                                        <p>&nbsp;</p>
                                        <p>
                                            These Terms &amp; Conditions
                                            constitute the entire agreement
                                            between the Organiser and the Vendor
                                            regarding the subject matter hereof
                                            and supersede all prior or
                                            contemporaneous communications,
                                            representations, or agreements,
                                            whether oral or written.
                                        </p>
                                        <p>&nbsp;</p>
                                        <p className="font-bold">10.⁠ ⁠Amend</p>
                                        <p>&nbsp;</p>
                                        <p>
                                            The Organiser reserves the right to
                                            amend these Terms &amp; Conditions
                                            at any time and notify Vendors.
                                            Vendors are responsible for
                                            reviewing the latest version
                                        </p>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicSiteLayout>
    );
};

export default TermsOfService;
