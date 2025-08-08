import MembersMetrics from "../../components/metrics/MembersMetrics";
import RecentMembers from "../../components/metrics/RecentMembers";
import DemographicCard from "../../components/metrics/DemographicCard";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Community App"
        description="This is Community App"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6">
          <MembersMetrics />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentMembers />
        </div>
      </div>
    </>
  );
}
