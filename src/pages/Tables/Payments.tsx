import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PaymentsTable from "../../components/tables/PaymentsTable";
import { useAuth } from "../../context/AuthContext";

export default function Payments() {
  const { user } = useAuth();
  if (user?.role !== "super-admin") {
    return <div className="p-8 text-center text-lg">Access denied.</div>;
  }
  return (
    <>
      <PageBreadcrumb pageTitle="Payments" />
      <div className="space-y-6">
        <PaymentsTable />
      </div>
    </>
  );
}
