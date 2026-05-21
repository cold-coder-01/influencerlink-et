import { IndustriesClient } from "@/components/industries/IndustriesClient";
import { fetchIndustriesOverview } from "@/lib/industries";

export const dynamic = "force-dynamic";

export default async function IndustriesPage() {
  const result = await fetchIndustriesOverview();

  return (
    <IndustriesClient
      error={result.success ? null : result.error}
      industries={result.data}
    />
  );
}
