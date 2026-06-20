import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroupMember } from "./types";

interface NewExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  setAmount: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  paidById: string;
  setPaidById: (val: string) => void;
  selectedParticipants: string[];
  toggleParticipant: (userId: string) => void;
  members?: GroupMember[];
  isSavingExpense: boolean;
  handleSaveExpense: (e: React.FormEvent) => Promise<void>;
}

export const NewExpenseDialog = ({
  isOpen,
  onOpenChange,
  amount,
  setAmount,
  description,
  setDescription,
  paidById,
  setPaidById,
  selectedParticipants,
  toggleParticipant,
  members,
  isSavingExpense,
  handleSaveExpense
}: NewExpenseDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-3xl text-foreground w-[92vw] max-w-sm p-4 sm:p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Ghi nhận khoản chi tiêu mới</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Nhập hóa đơn ăn uống, mua sắm chung và chọn các thành viên để chia đều.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveExpense} className="space-y-4 py-2 w-full">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Số tiền (VNĐ)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSavingExpense}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10 rounded-full px-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mô tả khoản chi</Label>
            <Input
              id="desc"
              placeholder="e.g. Ăn trưa bún chả, tiền mua nước ngọt..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSavingExpense}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10 rounded-full px-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payer" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Người trả tiền</Label>
            <select
              id="payer"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              disabled={isSavingExpense}
              className="w-full bg-background border border-input rounded-full px-4 py-2 text-sm text-foreground focus:border-ring outline-none"
            >
              {members?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name} ({m.user?.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Thành viên chia sẻ tiền ({selectedParticipants.length})</Label>
            <div className="border border-border p-4 max-h-[160px] overflow-y-auto space-y-2.5 bg-background/50 rounded-2xl">
              {members?.map((m) => {
                const isChecked = selectedParticipants.includes(m.userId);
                return (
                  <label key={m.userId} className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleParticipant(m.userId)}
                      disabled={isSavingExpense}
                      className="accent-primary scale-105"
                    />
                    <span>{m.user?.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={isSavingExpense}
              className="w-full h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
            >
              {isSavingExpense ? <Loader2 size={16} className="animate-spin" /> : "Ghi Nhận Khoản Chi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
