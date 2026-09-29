'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import { BaseTokenPriceProvider } from '@/contexts/BaseTokenPriceProvider';
import { WalletProvider } from '@/contexts/WalletContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isNewChat = pathname === '/dashboard' || pathname === '/dashboard/';
  const isChatSession = pathname.startsWith('/dashboard/chats/');
  const isReview = pathname.startsWith('/dashboard/review');
  const isStrategies = pathname.startsWith('/dashboard/strategies');

  return (
    <BaseTokenPriceProvider>
      <WalletProvider>
        <div className="min-h-screen bg-dark">
          <Sidebar />
          <div className={`ml-56 flex flex-col ${isNewChat || isChatSession || isReview || isStrategies ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
            <Topbar />
            <main className={isNewChat || isChatSession || isReview || isStrategies ? 'h-screen' : 'p-6'}>{children}</main>
          </div>
        </div>
      </WalletProvider>
    </BaseTokenPriceProvider>
  );
}
