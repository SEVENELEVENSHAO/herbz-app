import { ReferenceApp } from "@/components/reference-app";
import { getReferenceData } from "@/lib/reference-data";

export default function Home() {
  return <ReferenceApp data={getReferenceData()} />;
}
