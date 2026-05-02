// src/router/index.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntdApp } from "antd";
import "dayjs/locale/en";
import "dayjs/locale/vi";
import { createBrowserRouter } from "react-router-dom";

// Import các components và pages cần thiết
import ViewUpsertJob from "components/admin/job/upsert.job";
import LayoutAdmin from "components/admin/layout.admin";
import { AppContextProvider } from "components/context/app.context";
import PaymentResult from "components/payment/PaymentResult";
import LayoutApp from "components/share/layout.app";
import NotFound from "components/share/not.found";
import ProtectedRoute from "components/share/protected-route.ts";
import CompanyPage from "pages/admin/company";
import DashboardPage from "pages/admin/dashboard";
import JobTabs from "pages/admin/job/job.tabs";
import PermissionPage from "pages/admin/permission";
import ResumePage from "pages/admin/resume";
import RolePage from "pages/admin/role";
import UserPage from "pages/admin/user";
import LoginPage from "pages/auth/login";
import RegisterPage from "pages/auth/register";
import ChatPage from "pages/chat/ChatPage";
import ClientCompanyPage from "pages/company";
import ClientCompanyDetailPage from "pages/company/detail";
import CVAIEvaluationPage from "pages/cv-ai/CVAIEvaluation";
import HomePage from "pages/home";
import ClientJobPage from "pages/job";
import ClientJobStandaloneDetailPage from "pages/job/detail";
import RecruiterPage from "pages/recruiter";
import CreateOnlineResumePage from "pages/resume/create-online";
import PublicCvPage from "pages/user/public-cv";

// Import LayoutClient từ file mới
import PaymentPage from "@/components/admin/payment/payment.page";
import { LayoutClient } from "components/client/LayoutClient";

const queryClient = new QueryClient();

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      // Bọc QueryClientProvider và ContextProvider ở đây
      <QueryClientProvider client={queryClient}>
        <AppContextProvider>
          <LayoutApp>
            <LayoutClient />
          </LayoutApp>
        </AppContextProvider>
      </QueryClientProvider>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "job", element: <ClientJobPage /> },
      { path: "job/detail/:id", element: <ClientJobStandaloneDetailPage /> },
      { path: "company", element: <ClientCompanyPage /> },
      { path: "company/:id", element: <ClientCompanyDetailPage /> },
      {
        path: "recruiter",
        element: (
          <ProtectedRoute>
            <RecruiterPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "resume/create",
        element: (
          <ProtectedRoute>
            <CreateOnlineResumePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/online-resumes/:id",
        element: <PublicCvPage />,
      },
      { path: "cv-ai", element: <CVAIEvaluationPage /> },
      {
        path: "/payment/result",
        element: (
          <ProtectedRoute>
            <PaymentResult />
          </ProtectedRoute>
        ),
      },
      {
        path: "chat/detail",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: (
      // Bạn cũng có thể bọc QueryClient ở đây nếu cần
      <AppContextProvider>
        <AntdApp>
          <LayoutApp>
            <LayoutAdmin />
          </LayoutApp>
        </AntdApp>
      </AppContextProvider>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "company",
        element: (
          <ProtectedRoute>
            <CompanyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "user",
        element: (
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "job",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <JobTabs />
              </ProtectedRoute>
            ),
          },
          {
            path: "upsert",
            element: (
              <ProtectedRoute>
                <ViewUpsertJob />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "resume",
        element: (
          <ProtectedRoute>
            <ResumePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "permission",
        element: (
          <ProtectedRoute>
            <PermissionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "role",
        element: (
          <ProtectedRoute>
            <RolePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "payment",
        element: (
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
]);
