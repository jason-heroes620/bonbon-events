import { useEffect, useState } from "react";
import axios from "axios";
import type { Event } from "@/types";
import "../../css/home.css";
import { usePage, Link, router } from "@inertiajs/react";
import { toast, Toaster } from "sonner";
import PublicSiteLayout from "@/components/PublicSiteLayout";

const Home = () => {
    const [events, setEvents] = useState<Event[]>([]);

    const page = usePage();
    const flash = (page.props as any)?.flash as
        | { success?: string; error?: string; status?: string }
        | undefined;

    useEffect(() => {
        axios.get("/events-list").then((response) => {
            setEvents(response.data);
        });
    }, []);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        else if (flash?.error) toast.error(flash.error);
        else if (flash?.status) toast.info(flash.status);
    }, [flash?.success, flash?.error, flash?.status]);

    const monthShortUpper = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
    ];

    const toMonthDay = (dateValue?: string | null) => {
        if (!dateValue) return null;
        const dateOnly = dateValue.split("T")[0];
        const [y, m, d] = dateOnly.split("-").map((v) => Number(v));
        if (!y || !m || !d) return null;
        const month = monthShortUpper[m - 1];
        if (!month) return null;
        return { month, day: d };
    };

    const handleEventClick = (event: Event) => {
        router.visit(`/events/${event.event_id}/detail`);
    };

    return (
        <PublicSiteLayout>
            <div>
                <Toaster position="top-right" duration={8000} />

                <div className="hero">
                    <div className="decor d1"></div>
                    <div className="decor d2"></div>
                    <div className="eyebrow fu d1t">🐾 Upcoming Pet Events</div>
                    <h1 className="fu d2t">
                        Life&apos;s better when<br className="br"></br>your pet
                        is <em>happy</em>
                    </h1>
                    <p className="sub fu d3t">
                        Discover exclusive grooming days, adoption drives, pet
                        markets, and wellness events - curated with love by
                        BonBon × What the Pets.
                    </p>
                    <div className="actions fu d4t">
                        <Link href="/vendor/register" className="btn btn-p">
                            🐾 Join BonBon - It&apos;s Free
                        </Link>
                        <a href="#chips" className="btn btn-s">
                            Browse events ↓
                        </a>
                    </div>
                </div>

                <div className="stats">
                    <div className="stat">
                        <div className="stat-n">8,000+</div>
                        <div className="stat-l">Pet Parents</div>
                    </div>
                    <div className="stat">
                        <div className="stat-n">60+</div>
                        <div className="stat-l">Partner Brands</div>
                    </div>

                    <div className="stat">
                        <div className="stat-n">220+</div>
                        <div className="stat-l">Members And Counting</div>
                    </div>
                </div>

                <div className="filter-bar" id="chips">
                    <h2>Upcoming Events🐾</h2>
                    <div className="chips">
                        <div className="flex flex-wrap gap-4">
                            {events.length > 0
                                ? events.map((event) => (
                                      <div key={event.event_id} className="m-2">
                                          {(() => {
                                              const md = toMonthDay(
                                                  (event as any)
                                                      ?.event_start_date,
                                              );
                                              return (
                                                  <button
                                                      type="button"
                                                      onClick={() =>
                                                          handleEventClick(
                                                              event,
                                                          )
                                                      }
                                                      className="cursor-pointer"
                                                  >
                                                      <div className="event-thumb">
                                                          {event.event_image !==
                                                          null ? (
                                                              <img
                                                                  src={
                                                                      event.event_image
                                                                  }
                                                                  alt={
                                                                      event.event_name
                                                                  }
                                                                  className="chip-img"
                                                              />
                                                          ) : (
                                                              <img
                                                                  src="/empty_image.png"
                                                                  alt=""
                                                                  className="chip-img"
                                                              />
                                                          )}

                                                          {md ? (
                                                              <div className="event-date-badge">
                                                                  <div className="event-date-month">
                                                                      {md.month}
                                                                  </div>
                                                                  <div className="event-date-day">
                                                                      {md.day}
                                                                  </div>
                                                              </div>
                                                          ) : null}
                                                      </div>
                                                  </button>
                                              );
                                          })()}
                                      </div>
                                  ))
                                : "No upcoming events yet."}
                        </div>
                    </div>
                </div>
            </div>
        </PublicSiteLayout>
    );
};

export default Home;
