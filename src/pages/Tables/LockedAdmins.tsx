import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import LockedAdmins from "../../components/tables/LockedAdmins";

export default function LockedAdminsTable() {
  return (
    <>
      <PageBreadcrumb pageTitle="Locked Admins" />
      <div className="space-y-6">
        <LockedAdmins/>
      </div>
    </>
  );
} 