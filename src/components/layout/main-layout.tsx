'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import LeftSidebar from './left-sidebar';
import RightSidebar from './right-sidebar';
import TradingTab from '../tabs/trading-tab';
import PokerTab from '../tabs/poker-tab';
import PolymarketTab from '../tabs/polymarket-tab';
import CreditsDisplay from '../credits/credits-display';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from 'react';

export default function MainLayout() {
  const settings = useQuery(api.userSettings.getSettings);
  const updateSettings = useMutation(api.userSettings.updateSettings);
  const activeTab = settings?.activeTab || 'trading';

  // Initialize user with Autumn on first load
  useEffect(() => {
    const initializeAutumnUser = async () => {
      try {
        await fetch('/api/autumn/init-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'user' }),
        });
      } catch (error) {
        console.error('Failed to initialize Autumn user:', error);
      }
    };

    initializeAutumnUser();
  }, []);

  return (
    <div className="flex h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="w-full">
        {/* Left Panel - Brainrot */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <LeftSidebar />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main Content */}
        <ResizablePanel defaultSize={60}>
          <div className="flex flex-col h-full">
            <Tabs value={activeTab} onValueChange={(tab) => updateSettings({ activeTab: tab })}>
              <TabsList className="m-2">
                <TabsTrigger value="trading">📈 Trading</TabsTrigger>
                <TabsTrigger value="poker">🃏 Poker</TabsTrigger>
                <TabsTrigger value="polymarket">🎲 Polymarket</TabsTrigger>
                <TabsTrigger value="credits">💰 Credits</TabsTrigger>
              </TabsList>

              <div className="flex-1">
                <TabsContent value="trading" className="h-full p-2">
                  <TradingTab />
                </TabsContent>
                <TabsContent value="poker" className="h-full p-2">
                  <PokerTab />
                </TabsContent>
                <TabsContent value="polymarket" className="h-full p-2">
                  <PolymarketTab />
                </TabsContent>
                <TabsContent value="credits" className="h-full p-2">
                  <CreditsDisplay userId="user-1" />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Panel - Agent */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <RightSidebar activeTab={activeTab} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
