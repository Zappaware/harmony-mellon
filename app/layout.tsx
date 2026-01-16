import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "Harmony Mellon",
  description: "Gestiona tus proyectos eficientemente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
