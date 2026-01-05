import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import RequestsTable from "@/components/dashboard/RequestsTable";
import PendingApprovals from "@/components/dashboard/PendingApprovals";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64">
        <Header />
        
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, John. Here's your workflow overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Requests"
              value={156}
              change="+12% from last month"
              changeType="positive"
              icon={FileText}
              iconColor="bg-primary/10 text-primary"
            />
            <StatsCard
              title="Pending Approval"
              value={23}
              change="5 require urgent action"
              changeType="neutral"
              icon={Clock}
              iconColor="bg-warning/10 text-warning"
            />
            <StatsCard
              title="Approved"
              value={118}
              change="+8% approval rate"
              changeType="positive"
              icon={CheckCircle}
              iconColor="bg-success/10 text-success"
            />
            <StatsCard
              title="Rejected"
              value={15}
              change="-3% from last month"
              changeType="positive"
              icon={XCircle}
              iconColor="bg-destructive/10 text-destructive"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <RequestsTable />
            </div>
            <div className="xl:col-span-1">
              <PendingApprovals />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
