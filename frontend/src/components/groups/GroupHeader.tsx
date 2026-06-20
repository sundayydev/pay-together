"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Group } from "./types";

interface GroupHeaderProps {
  group: Group | null;
  copied: boolean;
  theme: string;
  changeTheme: (newTheme: string) => void;
  handleCopyInvite: () => void;
  openExpenseModal: () => void;
}

export const GroupHeader = ({
  group,
  copied,
  theme,
  changeTheme,
  handleCopyInvite,
  openExpenseModal
}: GroupHeaderProps) => {
  const router = useRouter();

  return (
    <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="p-2 border border-border hover:border-muted-foreground/30 bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer rounded-full transition-colors"
          title="Quay lại"
        >
          <ArrowLeft size={16} />
        </button>
        
        {group && (
          <div className="flex flex-col">
            <h1 className="text-md font-bold text-foreground leading-tight">{group.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mã mời:</span>
              <code className="text-[11px] font-mono font-bold text-foreground bg-muted px-2 border border-border rounded-md">
                {group.inviteCode}
              </code>
              <button
                onClick={handleCopyInvite}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full hover:bg-secondary transition-colors"
                title="Sao chép mã mời"
              >
                {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-muted/60 p-1 border border-border rounded-full mr-1">
          <button
            type="button"
            onClick={() => changeTheme("green")}
            className={`w-5 h-5 rounded-full bg-[#10b981] hover:scale-110 active:scale-95 transition-all cursor-pointer ${theme === "green" ? "ring-2 ring-primary ring-offset-2" : ""}`}
            title="Theme Xanh lá"
          />
          <button
            type="button"
            onClick={() => changeTheme("blue")}
            className={`w-5 h-5 rounded-full bg-[#3b82f6] hover:scale-110 active:scale-95 transition-all cursor-pointer ${theme === "blue" ? "ring-2 ring-primary ring-offset-2" : ""}`}
            title="Theme Xanh dương"
          />
          <button
            type="button"
            onClick={() => changeTheme("yellow")}
            className={`w-5 h-5 rounded-full bg-[#f59e0b] hover:scale-110 active:scale-95 transition-all cursor-pointer ${theme === "yellow" ? "ring-2 ring-primary ring-offset-2" : ""}`}
            title="Theme Trắng vàng"
          />
          <button
            type="button"
            onClick={() => changeTheme("pink")}
            className={`w-5 h-5 rounded-full bg-[#ec4899] hover:scale-110 active:scale-95 transition-all cursor-pointer ${theme === "pink" ? "ring-2 ring-primary ring-offset-2" : ""}`}
            title="Theme Hồng"
          />
          <button
            type="button"
            onClick={() => changeTheme("dark")}
            className={`w-5 h-5 rounded-full bg-[#18181b] hover:scale-110 active:scale-95 transition-all cursor-pointer ${theme === "dark" ? "ring-2 ring-primary ring-offset-2" : ""}`}
            title="Theme Tối (Dark)"
          />
        </div>
        <Button
          onClick={openExpenseModal}
          className="h-9 hidden sm:flex items-center gap-1.5 rounded-full font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={14} />
          Ghi Khoản Chi
        </Button>
      </div>
    </header>
  );
};
