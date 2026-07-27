import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Tracks() {
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    supabase
      .from("domains")
      .select("*")
      .order("name")
      .then(({ data }) => setDomains(data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Available Tracks</h1>
      <p className="text-muted text-lg mb-12">
        9 tracks, ~56 seats each. Claim yours before the cohort fills up.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {domains.map((d) => {
          const full = d.filled_count >= d.max_seats;
          return (
            <div key={d.slug} className="card p-6 flex flex-col">
              <h3 className="font-bold text-lg mb-1">{d.name}</h3>
              <p className="text-sm text-muted mb-6">
                {d.filled_count}/{d.max_seats} seats filled
              </p>
              <div className="mt-auto">
                <Link
                  to={full ? "#" : `/apply?domain=${d.slug}`}
                  aria-disabled={full}
                  className={full ? "btn-secondary opacity-50 pointer-events-none" : "btn-primary w-full"}
                >
                  {full ? "Full" : "Apply for this track"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
