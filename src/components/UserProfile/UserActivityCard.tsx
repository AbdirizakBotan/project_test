import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { EyeIcon, EyeCloseIcon } from "../../icons";
import api from "../../utils/axios";
import { AxiosError } from "axios";
import toast from 'react-hot-toast';

export default function UserActivityCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form state when user changes
  useEffect(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      setSaving(false);
      return;
    }

    try {
      await api.patch("/api/admins/change-password", {
        currentPassword,
        newPassword
      });

      // Reset form and close modal
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      closeModal();

      // Show success message and logout after a short delay
      toast.success("Password updated successfully. You will be logged out for security reasons.");
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        // Handle specific backend error messages
        switch (err.response.status) {
          case 401:
            toast.error("Current password is incorrect");
            break;
          case 404:
            toast.error("Admin account not found");
            break;
          default:
            toast.error(err.response.data.error || "Failed to update password");
        }
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setSaving(false);
    }
  };

  // Format date utility
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Activity
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Login
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(user?.last_login)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Logout
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(user?.last_logout)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Attempt Login Time
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(user?.attempt_login_time)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                 Created By (Username, Email)
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.created_by?.username || "-"}, {user?.created_by?.email || "-"}
                </p>
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
                d="M9 1.5C6.23858 1.5 4 3.73858 4 6.5V8H3.5C2.67157 8 2 8.67157 2 9.5V14.5C2 15.3284 2.67157 16 3.5 16H14.5C15.3284 16 16 15.3284 16 14.5V9.5C16 8.67157 15.3284 8 14.5 8H14V6.5C14 3.73858 11.7614 1.5 9 1.5ZM6 6.5C6 4.84315 7.34315 3.5 9 3.5C10.6569 3.5 12 4.84315 12 6.5V8H6V6.5ZM14.5 9.5V14.5H3.5V9.5H14.5Z"
                fill=""
              />
            </svg>
            Change Password
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Change Password
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your password to keep your account secure.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                <div>
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showCurrentPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
            </div>
            <div className="flex justify-end gap-3 px-2 py-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saving}
              >
                {saving ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
