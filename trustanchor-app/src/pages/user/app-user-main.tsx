import React, { useState } from 'react';
import { CertificateTable } from '@/components/custom/certificate-table';
import { StatCard } from '@/components/custom/stat-card';
import { RequestTab } from '@/components/custom/request-tab';
import { RevocationModal } from './dialog/revocation-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Shield, 
  Plus, 
  Key, 
  Layers, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  User,
  Anchor
} from 'lucide-react';

// Mock data
const MOCK_CERTS = [
  {
    id: 'cert-1',
    cn: 'marko.petrovic@corp.local',
    serialNumber: '4A:2F:B1:9E:CC:01',
    validFrom: '2024-03-15',
    validTo: '2025-03-15',
    status: 'active' as const,
    issuer: 'IB Corp Intermediate CA',
    keyAlg: 'RSA-2048',
  },
  {
    id: 'cert-2',
    cn: 'marko.petrovic-vpn@corp.local',
    serialNumber: '7D:44:A9:02:F3:88',
    validFrom: '2023-11-01',
    validTo: '2024-11-01',
    status: 'expired' as const,
    issuer: 'IB Corp Intermediate CA',
    keyAlg: 'EC-P256',
  },
  {
    id: 'cert-3',
    cn: 'mp-codesign@corp.local',
    serialNumber: '1B:88:C3:7A:00:F2',
    validFrom: '2024-01-20',
    validTo: '2025-01-20',
    status: 'revoked' as const,
    issuer: 'IB Corp Intermediate CA',
    keyAlg: 'RSA-4096',
  },
];

const MOCK_CAS = [
  { id: 'ca-1', name: 'IB Corp Intermediate CA', type: 'Intermediate', usage: 'Email / Client Auth' },
  { id: 'ca-2', name: 'IB Corp VPN CA', type: 'Intermediate', usage: 'VPN / Remote Access' },
  { id: 'ca-3', name: 'IB Corp Code Sign CA', type: 'Intermediate', usage: 'Code Signing' },
];

export default function AppUserMain() {
  const [activeTab, setActiveTab] = useState<'certs' | 'request'>('certs');
  const [certs, setCerts] = useState(MOCK_CERTS);
  const [revoking, setRevoking] = useState<typeof MOCK_CERTS[0] | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Mock user data - replace with actual user from auth context
  const userName = "Marko Petrović";
  const userEmail = "marko.petrovic@corp.local";

  const activeCerts = certs.filter(c => c.status === 'active').length;
  const expiredCerts = certs.filter(c => c.status === 'expired').length;
  const revokedCerts = certs.filter(c => c.status === 'revoked').length;

  const handleRevoke = (cert: typeof MOCK_CERTS[0]) => {
    setRevoking(cert);
  };

  const confirmRevoke = () => {
    if (!revoking) return;
    setCerts(prev => prev.map(c => c.id === revoking.id ? { ...c, status: 'revoked' as const } : c));
    setRevoking(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logging out...');
    alert('Logout functionality - implement your auth logout here');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-cyan-500/20">
            <Anchor className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg leading-none font-bold tracking-tight">
              Trust<span className="text-primary">Anchor</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              User Console
            </span>
          </div>
        </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="dot-grid mask-radial absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-widest text-primary uppercase">
            <Key className="w-3 h-3" /> MANAGE YOUR CERTIFICATES
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            My Certificates
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            View, download, and manage your personal X.509 end-entity certificates. Revoke or request new ones at any time.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <StatCard 
            label="Total" 
            value={certs.length} 
            icon={Layers} 
            accent="bg-muted text-muted-foreground" 
          />
          <StatCard 
            label="Active" 
            value={activeCerts} 
            icon={CheckCircle} 
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
          />
          <StatCard 
            label="Expired" 
            value={expiredCerts} 
            icon={Clock} 
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" 
          />
          <StatCard 
            label="Revoked" 
            value={revokedCerts} 
            icon={XCircle} 
            accent="bg-red-500/10 text-red-500" 
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {[
            { id: 'certs' as const, label: 'My Certificates', icon: Shield },
            { id: 'request' as const, label: 'Request Certificate', icon: Plus },
          ].map(tab => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-none border-b-2 -mb-px px-4 py-3 ${
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'certs' && (
          <Card className="fade-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <p className="text-sm font-bold text-card-foreground">Certificate List</p>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
            <CertificateTable certs={certs} onRevoke={handleRevoke} />
          </Card>
        )}

        {activeTab === 'request' && (
          <Card className="fade-in p-6">
            <RequestTab cas={MOCK_CAS} />
          </Card>
        )}
      </div>

      {/* Revocation Modal */}
      {revoking && (
        <RevocationModal 
          cert={revoking} 
          onClose={() => setRevoking(null)} 
          onConfirm={confirmRevoke} 
        />
      )}

      <footer className="mt-16 border-t border-border px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">IB Trust Anchor · X.509 PKI Platform · SIIT 2026</p>
      </footer>
    </div>
  );
}