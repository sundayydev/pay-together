import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SettlePeriodDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  isSettlingPeriod: boolean;
  handleCreateSession: (e: React.FormEvent) => Promise<void>;
}

export const SettlePeriodDialog = ({
  isOpen,
  onOpenChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isSettlingPeriod,
  handleCreateSession
}: SettlePeriodDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-3xl text-foreground max-w-sm p-4 sm:p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Chốt sổ kỳ chi tiêu</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Lựa chọn khoảng thời gian cần chốt các hóa đơn. Mặc định là các hóa đơn đang chờ quyết toán.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateSession} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Từ ngày (Start Date)</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSettlingPeriod}
              className="bg-background border-input text-foreground h-10 rounded-full px-4"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Đến ngày (End Date)</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSettlingPeriod}
              className="bg-background border-input text-foreground h-10 rounded-full px-4"
              required
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={isSettlingPeriod}
              className="w-full h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
            >
              {isSettlingPeriod ? <Loader2 size={16} className="animate-spin" /> : "Xác nhận chốt sổ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
