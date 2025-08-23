'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
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
  const leftSidebarCollapsed = settings?.leftSidebarCollapsed ?? false;

  const toggleLeftSidebar = () => {
    updateSettings({ leftSidebarCollapsed: !leftSidebarCollapsed });
  };

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
      {/* Collapsed Left Panel Toggle Button */}
      {leftSidebarCollapsed && (
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLeftSidebar}
            className="h-10 w-10 p-0 rounded-none border-r border-b hover:bg-muted/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex-1 w-10 bg-muted/20 border-r flex items-center justify-center">
            <div className="writing-mode-vertical text-xs text-muted-foreground font-medium tracking-wider" style={{ writingMode: 'vertical-rl' }}>
              🧠 BRAINROT
            </div>
          </div>
        </div>
      )}
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Brainrot */}
        {!leftSidebarCollapsed && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <LeftSidebar onToggleCollapse={toggleLeftSidebar} />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        
        {/* Main Content */}
        <ResizablePanel defaultSize={leftSidebarCollapsed ? 80 : 60}>
          <div className="flex flex-col h-full">
            <Tabs value={activeTab} onValueChange={(tab) => updateSettings({ activeTab: tab as "trading" | "poker" | "polymarket" | "credits" })}>
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
