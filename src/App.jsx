import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { RequireIntern, RequireAdmin } from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Tracks from "./pages/Tracks";
import Contact from "./pages/Contact";
import Apply from "./pages/Apply";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import Verify from "./pages/Verify";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Tasks from "./pages/dashboard/Tasks";
import Certificate from "./pages/dashboard/Certificate";
import Quiz from "./pages/dashboard/Quiz";

import AdminLayout from "./pages/admin/AdminLayout";
import Applications from "./pages/admin/Applications";
import Submissions from "./pages/admin/Submissions";
import Payments from "./pages/admin/Payments";
import QuizResults from "./pages/admin/QuizResults";
import Certificates from "./pages/admin/Certificates";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/tracks" element={<Tracks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/login" element={<Login />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/verify/:code" element={<Verify />} />

            <Route
              path="/dashboard"
              element={
                <RequireIntern>
                  <DashboardLayout />
                </RequireIntern>
              }
            >
              <Route index element={<Overview />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="certificate" element={<Certificate />} />
              <Route path="quiz" element={<Quiz />} />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Applications />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="payments" element={<Payments />} />
              <Route path="quiz-results" element={<QuizResults />} />
              <Route path="certificates" element={<Certificates />} />
            </Route>
          </Routes>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
