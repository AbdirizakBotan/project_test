import { useEffect, useState } from "react";
import api from "../../utils/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface Member {
  _id: string;
  full_name: string;
  phone: string;
  blood_type: string;
  district: string;
  createdAt?: string;
}

export default function RecentMember() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<Member[]>("/api/members");
        // Sort by createdAt descending and take the first five
        const sorted = res.data
          .filter(m => m.createdAt)
          .sort((a, b) => (b.createdAt! > a.createdAt! ? 1 : -1))
          .slice(0, 5);
        setMembers(sorted);
      } catch {
        setError("Failed to fetch recent members");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Members
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Last five members added to the system
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                #
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                Name
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                Phone
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                Blood Type
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                District
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">Loading...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-red-500">{error}</TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">No recent members found.</TableCell>
              </TableRow>
            ) : (
              members.map((member, idx) => (
                <TableRow key={member._id}>
                  <TableCell className="px-5 py-4 text-start dark:text-gray-400">{idx + 1}</TableCell>
                  <TableCell className="px-5 py-4 text-start dark:text-gray-400">{member.full_name}</TableCell>
                  <TableCell className="px-5 py-4 text-start dark:text-gray-400">{member.phone}</TableCell>
                  <TableCell className="px-5 py-4 text-start dark:text-gray-400">{member.blood_type}</TableCell>
                  <TableCell className="px-5 py-4 text-start dark:text-gray-400">{member.district}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
