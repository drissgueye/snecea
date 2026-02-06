import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import SubmitRequest from "@/pages/SubmitRequest";
import TicketsList from "@/pages/TicketsList";
import TicketDetail from "@/pages/TicketDetail";
import Calendar from "@/pages/Calendar";
import Poles from "@/pages/Poles";
import Delegates from "@/pages/Delegates";
import Documents from "@/pages/Documents";
import Communication from "@/pages/Communication";
import Admin from "@/pages/Admin";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* App routes with layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submit" element={<SubmitRequest />} />
            <Route path="/tickets" element={<TicketsList />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/poles" element={<Poles />} />
            <Route path="/delegates" element={<Delegates />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
