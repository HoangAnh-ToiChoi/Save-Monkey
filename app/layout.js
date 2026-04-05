import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Chi Tiêu Thông Minh | Save Monkey",
  description: "Ứng dụng tự động quản lý tài chính cá nhân",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased text-gray-100 bg-[#0B0F19] min-h-screen selection:bg-indigo-500/30`}
      >
        {children}
      </body>
    </html>
  );
}
