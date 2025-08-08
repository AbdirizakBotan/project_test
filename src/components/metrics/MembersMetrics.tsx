import { useEffect, useState } from "react";
import { GroupIcon, UserIcon } from "../../icons";
import api from "../../utils/axios";

interface Member {
  _id: string;
  gender: string;
}

export default function MembersMetrics() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get("/api/members");
        setMembers(response.data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };

    fetchMembers();
  }, []);

  const totalMembers = members.length;
  const maleMembers = members.filter(
    (member) => member.gender === "male"
  ).length;
  const femaleMembers = members.filter(
    (member) => member.gender === "female"
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Members
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {totalMembers}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <UserIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Male
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {maleMembers}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <UserIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Female
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {femaleMembers}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
