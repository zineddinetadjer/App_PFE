import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main content pane */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
