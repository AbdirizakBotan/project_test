import PageBreadcrumb from "../../components/common/PageBreadCrumb";
// import ComponentCard from "../../components/common/ComponentCard";
// import PageMeta from "../../components/common/PageMeta";
import MembersTable from "../../components/tables/Members";

export default function MembersPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Community Members" />
      <div className="space-y-6">
        
          <MembersTable />
        
      </div>
    </>
  );
}
