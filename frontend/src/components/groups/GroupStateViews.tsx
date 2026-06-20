"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Group } from "./types";

interface GroupStateViewsProps {
  isLoading: boolean;
  group: Group | null;
  onBackToDashboard: () => void;
  children: React.ReactNode;
}

export const GroupStateViews = ({
  isLoading,
  group,
  onBackToDashboard,
  children
}: GroupStateViewsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="text-xs text-muted-foreground animate-pulse">Đang tải dữ liệu quỹ nhóm...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-red-500">Không tìm thấy nhóm chi tiêu</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Nhóm có thể đã bị xóa hoặc tài khoản của bạn không có quyền truy cập vào nhóm này.
        </p>
        <Button onClick={onBackToDashboard} variant="outline" className="mt-6 rounded-full px-6">
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
