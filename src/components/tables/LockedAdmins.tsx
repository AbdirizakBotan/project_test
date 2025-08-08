import { useEffect, useState } from "react";
import api from "../../utils/axios";
import { AxiosError } from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface Admin {
  _id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  is_login: boolean;
  is_locked: boolean;
  last_login?: string;
  createdAt?: string;
  attempt_login?: number;
  attempt_login_time?: string;
  last_logout?: string;
  created_by?: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
}

export default function LockedAdminsTable() {
  useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state for unlock confirmation
  const {
    isOpen: isUnlockModalOpen,
    openModal: openUnlockModal,
    closeModal: closeUnlockModal,
  } = useModal();
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    fetchLockedAdmins();
  }, []);

  const fetchLockedAdmins = () => {
    setLoading(true);
    api
      .get("/api/admins/locked")
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUnlock = async () => {
    if (!selectedAdmin) return;
    setUnlocking(true);
    setError(null);

    try {
      await api.post("/api/auth/unlock", {
        id: selectedAdmin._id,
        type: "admin",
      });
      closeUnlockModal();
      fetchLockedAdmins();
      toast.success("Admin unlocked successfully!", { position: "top-center" }); // <-- show toast
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const msg = err.response.data?.error || "Failed to unlock admin";
        setError(msg);
        toast.error(msg, { position: "top-center" }); // <-- toast error
      } else {
        setError("Failed to unlock admin");
        toast.error("Failed to unlock admin", { position: "top-center" }); // <-- toast error
      }
    } finally {
      setUnlocking(false);
    }
  };

  // Filtering logic
  // Sort locked admins alphabetically by username before filtering
  const filteredAdmins = admins
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .filter((admin) => {
      const matchesSearch =
        filters.search === "" ||
        admin.username.toLowerCase().includes(filters.search.toLowerCase()) ||
        admin.phone.includes(filters.search) ||
        admin.email.toLowerCase().includes(filters.search.toLowerCase());

      return matchesSearch;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAdmins.length / pageSize);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      {/* Filter Inputs */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          placeholder="Search Name, Email or Phone"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
        />
        <button
          className="btn btn-success flex items-center px-10 py-2 rounded-sm bg-brand-500 text-white hover:bg-brand-600"
          onClick={() => setFilters({ search: "" })}
        >
          Reset
        </button>
      </div>

      {/* Locked Admins Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Username
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Phone
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Role
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-5 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Last Login
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-16 text-center align-middle"
                  >
                    <div className="flex flex-col items-center justify-center min-h-[180px] w-full">
                      <svg
                        className="animate-spin mb-3 text-brand-500"
                        width="40"
                        height="40"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          stroke="#465FFF"
                          strokeWidth="3"
                          strokeDasharray="32"
                          strokeDashoffset="24"
                          fill="none"
                        />
                      </svg>
                      <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        Loading...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-24 text-center align-middle"
                  >
                    <div className="flex flex-col items-center justify-center min-h-[180px] w-full">
                      <svg
                        className="mb-4 text-gray-400 animate-bounce"
                        width="64"
                        height="64"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                          fill="#A3AED0"
                        />
                        <circle cx="9.375" cy="9.375" r="2" fill="#465FFF" />
                      </svg>
                      <span className="text-gray-500 dark:text-gray-400 text-lg font-semibold">
                        No Locked Admins Found
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdmins.map((admin, idx) => (
                  <TableRow key={admin._id}>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {admin.username}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {admin.email}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {admin.phone}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {admin.role}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      <Badge size="sm" color="error">
                        Locked
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {admin.last_login
                        ? new Date(admin.last_login).toLocaleString()
                        : "Never Logged In"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      <button
                        onClick={() => {
                          setSelectedAdmin(admin);
                          openUnlockModal();
                        }}
                        className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 1.5C6.23858 1.5 4 3.73858 4 6.5V8H3.5C2.67157 8 2 8.67157 2 9.5V14.5C2 15.3284 2.67157 16 3.5 16H14.5C15.3284 16 16 15.3284 16 14.5V9.5C16 8.67157 15.3284 8 14.5 8H14V6.5C14 3.73858 11.7614 1.5 9 1.5ZM6 6.5C6 4.84315 7.34315 3.5 9 3.5C10.6569 3.5 12 4.84315 12 6.5V8H6V6.5ZM14.5 9.5V14.5H3.5V9.5H14.5Z"
                            fill=""
                          />
                        </svg>
                        Unlock
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Unlock Confirmation Modal */}
      <Modal
        isOpen={isUnlockModalOpen}
        onClose={closeUnlockModal}
        className="max-w-[500px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <h5 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
            Unlock Admin Account
          </h5>
          {error && <div className="mb-2 text-red-500">{error}</div>}
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Are you sure you want to unlock {selectedAdmin?.username}'s account?
            This will reset their login attempts and allow them to log in again.
          </p>
          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={closeUnlockModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              disabled={unlocking}
            >
              Cancel
            </button>
            <button
              onClick={handleUnlock}
              type="button"
              className="btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              disabled={unlocking}
            >
              {unlocking ? "Unlocking..." : "Unlock Account"}
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex justify-between items-center mt-4 dark:text-gray-400">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, filteredAdmins.length)} of{" "}
          {filteredAdmins.length} entries
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 rounded border ${
                currentPage === idx + 1 ? "bg-brand-500 text-white" : ""
              }`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded border"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
