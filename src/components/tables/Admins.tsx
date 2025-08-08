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
import PhoneInput from "../form/input/PhoneInput";
import Label from "../form/Label";
import { EyeIcon, EyeCloseIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import PhotoUpload from "../form/PhotoUpload";
import toast from "react-hot-toast";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

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
  photo?: string;
}

export default function AdminsTable() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "admin",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    role: "admin",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [passwordAdmin, setPasswordAdmin] = useState<Admin | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoError, setEditPhotoError] = useState<string | null>(null);

  const countries = [
    { code: "US", label: "+1" },
    { code: "SO", label: "+252" }, // Somalia
    { code: "GB", label: "+44" }, // UK
    { code: "DE", label: "+49" }, // Germany
    { code: "SE", label: "+46" }, // Sweden
    { code: "FI", label: "+358" }, // Finland
    { code: "TR", label: "+90" }, // Turkey
    { code: "KE", label: "+254" }, // Kenya
    { code: "ET", label: "+251" }, // Ethiopia
    { code: "DJ", label: "+253" }, // Djibouti
    { code: "UG", label: "+256" }, // Uganda
    { code: "TZ", label: "+255" }, // Tanzania
  ];

  // Modal state for Details Admin
  const {
    isOpen: isDetailsOpen,
    openModal: openDetailsModal,
    closeModal: closeDetailsModal,
  } = useModal();
  const [detailsAdmin, setDetailsAdmin] = useState<Admin | null>(null);

  const [filters, setFilters] = useState({
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25; // or whatever you want

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = () => {
    setLoading(true);
    api
      .get("/api/admins")
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setPhotoError(null);

    if (!phoneRegex.test(form.phone)) {
      setError(
        "Invalid phone number format. Please include country code (e.g., +252)."
      );
      toast.error(
        "Invalid phone number format. Please include country code (e.g., +252).",
        { position: "top-center" }
      );
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("password", form.password);
      formData.append("role", form.role);
      if (photo) {
        formData.append("photo", photo);
      }

      await api.post("/api/admins/add", formData);
      toast.success("Admin added successfully!", { position: "top-center" });
      closeModal();
      setForm({
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "admin",
      });
      setPhoto(null);
      fetchAdmins();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const msg = err.response.data?.error || "Failed to add admin";
        setError(msg);
        toast.error(msg, { position: "top-center" }); // <-- toast error
      } else {
        setError("Failed to add admin");
        toast.error("Failed to add admin", { position: "top-center" }); // <-- toast error
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (admin: Admin) => {
    setEditAdmin(admin);
    setEditForm({
      username: admin.username,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
    });
  };

  const closeEditModal = () => {
    setEditAdmin(null);
    setEditError(null);
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditAdmin = async () => {
    if (!editAdmin) return;
    setEditSaving(true);
    setEditError(null);
    setEditPhotoError(null);

    if (!phoneRegex.test(editForm.phone)) {
      setEditError(
        "Invalid phone number format. Please include country code (e.g., +252)."
      );
      toast.error(
        "Invalid phone number format. Please include country code (e.g., +252).",
        { position: "top-center" }
      );
      setEditSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", editForm.username);
      formData.append("email", editForm.email);
      formData.append("phone", editForm.phone);
      formData.append("role", editForm.role);

      // Only append photo if a new one is selected
      if (editPhoto) {
        formData.append("photo", editPhoto);
      }

      await api.put(`/api/admins/${editAdmin._id}`, formData);
      toast.success("Admin updated successfully!", { position: "top-center" });
      closeEditModal();
      fetchAdmins();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const msg = err.response.data?.error || "Failed to update admin";
        setEditError(msg);
        toast.error(msg, { position: "top-center" }); // <-- toast error
      } else {
        setEditError("Failed to update admin");
        toast.error("Failed to update admin", { position: "top-center" }); // <-- toast error
      }
    } finally {
      setEditSaving(false);
    }
  };

  const openPasswordModal = (admin: Admin) => {
    setPasswordAdmin(admin);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordError(null);
  };

  const closePasswordModal = () => {
    setPasswordAdmin(null);
    setPasswordError(null);
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    if (!passwordAdmin) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await api.patch(`/api/admins/${passwordAdmin._id}/reset-password`, {
        newPassword: passwordForm.newPassword,
      });
      closePasswordModal();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setPasswordError(
          err.response.data?.error || "Failed to update password"
        );
      } else {
        setPasswordError("Failed to update password");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // Filtering logic
  // Sort admins alphabetically by username before filtering
  const filteredAdmins = admins
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .filter((admin) => {
      // Exclude super-admins, current user and locked admins
      if (
        admin.role === "super-admin" ||
        admin._id === currentUser?._id ||
        admin.is_locked
      ) {
        return false;
      }

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
      {/* Add Admin Button */}
      <div className="flex justify-center mb-4">
        <button
          className="btn btn-success flex items-center px-4 py-2 rounded-sm bg-brand-500 text-white hover:bg-brand-600"
          onClick={openModal}
        >
          + Add Administrator
        </button>
      </div>

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

      {/* Admins Table */}
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
                  Action{" "}
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
                        Sorry! No Result Found
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
                      <Badge
                        size="sm"
                        color={
                          admin.is_login
                            ? "success"
                            : admin.is_locked
                            ? "error"
                            : "warning"
                        }
                      >
                        {admin.is_login
                          ? "Online"
                          : admin.is_locked
                          ? "Locked"
                          : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      {admin.last_login
                        ? new Date(admin.last_login).toLocaleString()
                        : "Never Logged In"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start dark:text-gray-400">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
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
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                              fill=""
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => openPasswordModal(admin)}
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
                        </button>
                        <button
                          onClick={() => {
                            setDetailsAdmin(admin);
                            openDetailsModal();
                          }}
                          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-info"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Admin Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-6 mt-15"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h5 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Add New Administrator
            </h5>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Fill in the details to add a new administrator.
            </p>
            {error && <div className="mb-2 text-red-500">{error}</div>}
          </div>
          <form onSubmit={handleAddAdmin} className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <PhoneInput
                  selectPosition="start"
                  countries={countries}
                  placeholder="+252 61xxxxxxx"
                  initialPhoneNumber={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    required
                  />
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Role
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>
              <div>
                <Label>Profile Photo</Label>
                <PhotoUpload
                  onChange={(file) => setPhoto(file)}
                  error={photoError || undefined}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                disabled={saving}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        isOpen={!!editAdmin}
        onClose={closeEditModal}
        className="max-w-[500px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h5 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Administrator
            </h5>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update admin details here.
            </p>
            {editError && <div className="mb-2 text-red-500">{editError}</div>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditAdmin();
            }}
            className="space-y-5 p-4 flex flex-col"
          >
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Username
                </label>
                <input
                  name="username"
                  value={editForm.username}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <PhoneInput
                  selectPosition="start"
                  countries={countries}
                  placeholder="+252 61xxxxxxx"
                  initialPhoneNumber={editForm.phone}
                  onChange={(value) =>
                    setEditForm({ ...editForm, phone: value })
                  }
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Role
                </label>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>
              <div>
                <Label>Profile Photo</Label>
                <PhotoUpload
                  onChange={(file) => setEditPhoto(file)}
                  currentPhoto={editAdmin?.photo}
                  error={editPhotoError || undefined}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 sm:justify-end">
              <button
                onClick={closeEditModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                disabled={editSaving}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal
        isOpen={!!passwordAdmin}
        onClose={closePasswordModal}
        className="max-w-[500px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <h5 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
            Change Password
          </h5>
          {passwordError && (
            <div className="mb-2 text-red-500">{passwordError}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                New Password
              </label>
              <div className="relative">
                <input
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                />
                <span
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showNewPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </span>
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                />
                <span
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={closePasswordModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              disabled={passwordSaving}
            >
              Close
            </button>
            <button
              onClick={handleChangePassword}
              type="button"
              className="btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              disabled={passwordSaving}
            >
              {passwordSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Details Admin Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={closeDetailsModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <h5 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
            Admin Details
          </h5>
          {detailsAdmin && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32 text-gray-700 dark:text-gray-400">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Username
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.username}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.email}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.phone}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Role
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.role}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.is_login
                    ? "Online"
                    : detailsAdmin.is_locked
                    ? "Locked"
                    : "Offline"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Last Login
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.last_login
                    ? new Date(detailsAdmin.last_login).toLocaleString()
                    : "Never Logged In"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Attempt Login
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.attempt_login}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Attempt Login Time
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.attempt_login_time
                    ? new Date(detailsAdmin.attempt_login_time).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Last Logout
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.last_logout
                    ? new Date(detailsAdmin.last_logout).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Created By (Username)
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.created_by?.username || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Created By (Email)
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.created_by?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Registered Date
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {detailsAdmin.createdAt
                    ? new Date(detailsAdmin.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <button
              onClick={closeDetailsModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
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
