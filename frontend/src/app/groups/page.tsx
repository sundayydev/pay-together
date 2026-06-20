"use client";

import * as React from "react";
import GroupDetailsClient from "./GroupDetailsClient";

export default function GroupPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-background text-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">Đang tải dữ liệu...</span>
      </div>
    }>
      <GroupDetailsClient />
    </React.Suspense>
  );
}
