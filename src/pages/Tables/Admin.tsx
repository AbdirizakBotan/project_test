import PageBreadcrumb from "../../components/common/PageBreadCrumb";
// import ComponentCard from "../../components/common/ComponentCard";
// import PageMeta from "../../components/common/PageMeta";
import AdminsTable from "../../components/tables/Admins";

export default function AdminTable() {
  return (
    <>
      <PageBreadcrumb pageTitle="Administrators" />
      <div className="space-y-6">
        
          <AdminsTable />
        
      </div>
    </>
  );
}
