import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { groups, modules } from "../lib/catalog";

export const metadata: Metadata = {
  title: "PAMIZE Synapse | Panel zarządczy",
  description: "PAMIZE Synapse: środowisko do projektowania i zarządzania cyfrowymi pracownikami"
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="pl">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link href="/" className="brand"><span className="brand-symbol">P</span>
              <span><strong>PAMIZE</strong><small>SYNAPSE</small></span>
            </Link>
            <div className="env-tag">Środowisko demonstracyjne v0.1</div>
            <nav aria-label="Moduły Synapse" className="side-nav">
              <Link className="nav-link home-link" href="/">◈ &nbsp; Panel główny</Link>
              {groups.map((group) => (
                <div key={group} className="nav-group">
                  <p className="nav-label">{group}</p>
                  {modules.filter((module) => module.group === group).map((module) => (
                    <Link key={module.slug} className="nav-link" href={`/modules/${module.slug}`}>
                      <span className="nav-dot" aria-hidden="true"/>
                      <span>{module.title}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="sidebar-footer">AI for real business impact<br/>© PAMIZE 2026</div>
          </aside>
          <div className="workspace">
            <header className="topbar">
              <div><span className="topbar-eyebrow">PAMIZE SYNAPSE</span><strong>Executive Cockpit</strong></div>
              <div className="topbar-right"><span className="status-indicator"/> Wersja projektowa · bez danych klientów</div>
            </header>
            <main className="main-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
