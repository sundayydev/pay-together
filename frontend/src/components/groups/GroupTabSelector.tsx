"use client";

import * as React from "react";
import { FileSpreadsheet, Users, DollarSign } from "lucide-react";

interface GroupTabSelectorProps {
  activeTab: "expenses" | "members" | "settlement";
  setActiveTab: (tab: "expenses" | "members" | "settlement") => void;
  expensesCount: number;
  membersCount: number;
}

export const GroupTabSelector = ({
  activeTab,
  setActiveTab,
  expensesCount,
  membersCount
}: GroupTabSelectorProps) => {
  return (
    <div className="flex border-b border-border mb-8 justify-between sm:justify-start gap-1 sm:gap-2">
      <button
        onClick={() => setActiveTab("expenses")}
        className={`py-3 px-4 sm:px-6 text-sm font-semibold border-b-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none ${
          activeTab === "expenses"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <FileSpreadsheet size={18} className="shrink-0" />
        <span className="hidden sm:inline">Lịch sử Chi tiêu</span>
        <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-1.5 py-0.5 rounded-full select-none">
          {expensesCount}
        </span>
      </button>
      
      <button
        onClick={() => setActiveTab("members")}
        className={`py-3 px-4 sm:px-6 text-sm font-semibold border-b-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none ${
          activeTab === "members"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users size={18} className="shrink-0" />
        <span className="hidden sm:inline">Thành viên</span>
        <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-1.5 py-0.5 rounded-full select-none">
          {membersCount}
        </span>
      </button>

      <button
        onClick={() => setActiveTab("settlement")}
        className={`py-3 px-4 sm:px-6 text-sm font-semibold border-b-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none ${
          activeTab === "settlement"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <DollarSign size={18} className="shrink-0" />
        <span className="hidden sm:inline">Công nợ & Quyết toán</span>
        <span className="sm:hidden text-xs">Quyết toán</span>
      </button>
    </div>
  );
};
