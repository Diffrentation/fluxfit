"use client";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import { ConfigProvider, theme } from "antd";

export default function AdminLayout({ children }) {
  // This layout ensures admin pages don't show the footer
  // The footer is conditionally rendered in the root layout
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1e9a58',
          colorBgBase: '#000000',
          colorBgContainer: '#09090b',
          colorBgElevated: '#18181b',
          colorBorder: '#27272a',
          colorTextBase: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 8,
          controlHeight: 42,
          fontFamily: 'inherit',
        },
        components: {
          Card: {
            colorBgContainer: '#09090b',
            borderRadius: 16,
            colorBorderSecondary: '#27272a',
          },
          Modal: {
            contentBg: '#18181b',
            headerBg: 'transparent',
            borderRadius: 16,
          },
          Table: {
            colorBgContainer: '#09090b',
            borderColor: '#27272a',
            headerBg: '#09090b',
            headerSplitColor: 'transparent',
            headerColor: 'rgba(255, 255, 255, 0.65)',
            rowHoverBg: '#18181b',
          },
          Button: {
            borderRadius: 8,
            primaryColor: '#ffffff',
          },
          Input: {
            colorBgContainer: '#09090b',
            colorBorder: '#27272a',
            activeBorderColor: '#1e9a58',
            hoverBorderColor: '#1e9a58',
          },
          Select: {
            colorBgContainer: '#09090b',
            colorBorder: '#27272a',
            optionSelectedBg: '#18181b',
          },
          Switch: {
            colorPrimary: '#1e9a58',
          }
        }
      }}
    >
      <div className="dark min-h-screen bg-black text-white">
        <SidebarProvider>
          <AdminSidebar />
          {children}
        </SidebarProvider>
      </div>
    </ConfigProvider>
  );
}
