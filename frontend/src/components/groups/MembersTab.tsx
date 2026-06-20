import * as React from "react";
import { User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GroupMember } from "./types";

interface MembersTabProps {
  members?: GroupMember[];
}

export const MembersTab = ({ members }: MembersTabProps) => {
  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members?.map((m) => (
          <Card key={m.id} className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 shadow-xs">
            {m.user?.avatarUrl ? (
              <img 
                src={m.user.avatarUrl} 
                alt={m.user.name} 
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" 
              />
            ) : (
              <div className="w-10 h-10 bg-muted/80 border border-border flex items-center justify-center text-muted-foreground rounded-full shrink-0 select-none">
                <UserIcon size={18} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{m.user?.name}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full select-none ${
                  m.role === "ADMIN" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-muted text-muted-foreground"
                }`}>
                  {m.role}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{m.user?.phoneNumber}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
