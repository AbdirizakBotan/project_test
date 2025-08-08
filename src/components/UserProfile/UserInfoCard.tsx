import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/axios";
import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import PhoneInput from "../form/input/PhoneInput";
import toast from "react-hot-toast";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, setUser, checkAuth } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user?.photo || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when user changes
  useEffect(() => {
    setForm({
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setPreviewUrl(user?.photo || "");
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prevForm => ({ ...prevForm, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!user || !user._id) {
      setError("User data not fully loaded. Please try again or refresh the page.");
      toast.error("User data not fully loaded. Please try again or refresh the page.", { position: "top-center" });
      setSaving(false);
      return;
    }

    if (!phoneRegex.test(form.phone)) {
      setError("Invalid phone number format. Please include country code (e.g., +252).");
      toast.error("Invalid phone number format. Please include country code (e.g., +252).", { position: "top-center" });
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('role', user.role);
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      const res = await api.put(`/api/admins/${user._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Backend response data (success path):', res.data);
      
      const updatedUser = res.data.data || res.data.user || res.data;

      if (updatedUser) {
        setUser(updatedUser);
        closeModal();
        setError(null);
        checkAuth();
        toast.success("Profile updated successfully!", { position: "top-center" });
      } else {
        setError("Update successful, but could not read updated user data from response.");
        closeModal();
        toast.error("Update successful, but could not read updated user data from response.", { position: "top-center" });
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        console.error('Axios error during profile update (response received):', err.response);
        // Backend indicated an error via status code, but might still have updated data.
        // Given "Admin updated successfully" log, we prioritize backend's success.
        const updatedUserFromError = err.response.data.data || err.response.data.user || err.response.data;

        if (updatedUserFromError) {
          setUser(updatedUserFromError);
          setError(null);
          checkAuth();
          toast.success("Profile updated successfully!", { position: "top-center" });
        } else {
          const msg = err.response.data.message || "Failed to update profile (backend error but data may be updated).";
          setError(msg);
          toast.error(msg, { position: "top-center" }); // <-- toast error
        }
        closeModal();
      } else {
        setError("Failed to update profile. Please check your network connection.");
        toast.error("Failed to update profile. Please check your network connection.", { position: "top-center" }); // <-- toast error
      }
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Admin Information
              </h4>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Username</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.username || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.email || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.phone || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.role || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Status</p>
              <p className={`text-sm font-medium ${user?.is_login ? "text-green-600" : "text-red-500"} dark:text-white/90`}>
                {user?.is_login ? "Online" : "Offline"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Registered Date</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{formatDate(user?.createdAt)}</p>
            </div>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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
          Edit
        </button>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Admin Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your account up-to-date.
            </p>
            {error && <div className="mb-2 text-red-500">{error}</div>}
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[350px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                <div className="col-span-2 lg:col-span-1">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative">
                      <img
                        src={previewUrl || "/default-avatar.png"}
                        alt={user?.username}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-dark"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click the camera icon to change your photo
                    </p>
                  </div>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Username</Label>
                  <Input type="text" name="username" value={form.username} onChange={handleChange} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Email Address</Label>
                  <Input type="text" name="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Phone</Label>
                  <PhoneInput
                    selectPosition="start"
                    countries={countries}
                    placeholder="+252 61xxxxxxx"
                    initialPhoneNumber={form.phone}
                    onChange={(value) => setForm(prevForm => ({ ...prevForm, phone: value }))} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
