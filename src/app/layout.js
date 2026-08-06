import { Suspense } from "react";
import { ConfigProvider } from "antd";
import "./globals.css";
import { Nav } from "@/components/Header/Nav";
import AdminAccessNotice from "@/components/AdminAccessNotice";
import ConditionalFooter from "@/components/ConditionalFooter";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { CustomDesignProvider } from "@/context/CustomDesignContext";
import AppToasterShell from "@/components/providers/AppToasterShell";
import RouteGuard from "@/components/RouteGuard";
import { Outfit } from "next/font/google";

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: {
    default: "FluxFit",
    template: "%s | FluxFit",
  },
  applicationName: "FluxFit",
  description: "Shop fashion and create custom clothing with FluxFit.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme !== 'dark') {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${outfit.className} antialiased`}
        suppressHydrationWarning
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1e9a58',
              borderRadius: 12,
              controlHeight: 42,
              fontFamily: 'inherit',
            },
            components: {
              Card: {
                colorBgContainer: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
              },
              Modal: {
                contentBg: 'rgba(255, 255, 255, 0.98)',
                headerBg: 'transparent',
                borderRadius: 16,
              },
              Button: {
                borderRadius: 8,
              }
            }
          }}
        >
          <ThemeProvider>
            <AuthProvider>
              <AppToasterShell />
              <Suspense fallback={null}>
                <AdminAccessNotice />
              </Suspense>
              <CustomDesignProvider>
                <CartProvider>
                  <WishlistProvider>
                    <RouteGuard>
                      <Nav />
                      {children}
                      <ConditionalFooter />
                    </RouteGuard>
                  </WishlistProvider>
                </CartProvider>
              </CustomDesignProvider>
            </AuthProvider>
          </ThemeProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
