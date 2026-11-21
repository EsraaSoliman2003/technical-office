import { Spinner } from "@/components/ui";

export default function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-primary-text">
      <Spinner size={36} />
    </div>
  );
}
