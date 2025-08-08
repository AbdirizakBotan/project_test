import { useEffect, useState } from "react";
import api from "../../utils/axios";

interface Member {
  _id: string;
  district: string;
}

interface DistrictStat {
  district: string;
  count: number;
  percentage: number;
}


export default function DemographicCard() {
  const [districtStats, setDistrictStats] = useState<DistrictStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await api.get<Member[]>("/api/members");
        const members = res.data;
        const districtMap: Record<string, number> = {};
        members.forEach((m) => {
          if (m.district) {
            districtMap[m.district] = (districtMap[m.district] || 0) + 1;
          }
        });
        const total = members.length;
        const stats: DistrictStat[] = Object.entries(districtMap)
          .map(([district, count]) => ({
            district,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count);
        setDistrictStats(stats);
      } catch {
        setDistrictStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Members Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Number of members based on district
          </p>
        </div>
      </div>

      <div className="space-y-5 mt-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : districtStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data available</div>
        ) : (
          districtStats.slice(0, 8).map((stat) => (
            <div className="flex items-center justify-between" key={stat.district}>
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {stat.district}
                  </p>
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {stat.count} Members
                  </span>
                </div>
              </div>
              <div className="flex w-full max-w-[140px] items-center gap-3">
                <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                  <div
                    className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {stat.percentage}%
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
