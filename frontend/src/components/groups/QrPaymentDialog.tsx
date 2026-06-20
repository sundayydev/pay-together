import * as React from "react";
import { TrendingDown, ShieldCheck, Loader2, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankLogoButton } from "./BankLogoButton";
import { User, Settlement, Bank } from "./types";
import { toast } from "sonner";

interface QrPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSettlement: Settlement | null;
  groupName: string;
  currentUser: User | null;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  profileBankCode: string;
  setProfileBankCode: (val: string) => void;
  profileBankAccount: string;
  setProfileBankAccount: (val: string) => void;
  profileBankAccountName: string;
  setProfileBankAccountName: (val: string) => void;
  isUpdatingProfile: boolean;
  banksList: Bank[];
  profileBankSearch: string;
  setProfileBankSearch: (val: string) => void;
  handleUpdateProfile: (e: React.FormEvent) => Promise<void>;
}

export const QrPaymentDialog = ({
  isOpen,
  onOpenChange,
  selectedSettlement,
  groupName,
  currentUser,
  isProfileOpen,
  setIsProfileOpen,
  profileBankCode,
  setProfileBankCode,
  profileBankAccount,
  setProfileBankAccount,
  profileBankAccountName,
  setProfileBankAccountName,
  isUpdatingProfile,
  banksList,
  profileBankSearch,
  setProfileBankSearch,
  handleUpdateProfile
}: QrPaymentDialogProps) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!selectedSettlement) return null;

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasBankAccount = selectedSettlement.receiver?.bankCode && selectedSettlement.receiver?.bankAccount;
  const isPayer = currentUser && selectedSettlement.payerId === currentUser.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-3xl text-foreground w-[95vw] max-w-md p-5 sm:p-6 shadow-2xl flex flex-col items-center">
        <DialogHeader className="w-full">
          <DialogTitle className="text-lg font-bold text-foreground text-center">Thanh toán công nợ VietQR</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground text-center">
            {isPayer ? (
              <>Bạn đang trả nợ cho <span className="font-semibold text-foreground">{selectedSettlement.receiver?.name}</span></>
            ) : (
              <><span className="font-semibold text-foreground">{selectedSettlement.payer?.name}</span> đang trả nợ cho <span className="font-semibold text-primary">{selectedSettlement.receiver?.name}</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasBankAccount ? (
          /* Receiver has set up bank account details */
          <div className="w-full flex flex-col items-center space-y-4 pt-2">
            {/* VietQR template compact2 */}
            <div className="w-48 h-48 border border-border bg-white p-2 rounded-2xl flex items-center justify-center overflow-hidden">
              <img
                src={`https://img.vietqr.io/image/${selectedSettlement.receiver?.bankCode}-${selectedSettlement.receiver?.bankAccount}-compact2.png?amount=${selectedSettlement.amount}&addInfo=PT%20${encodeURIComponent(groupName || "")}%20${encodeURIComponent(selectedSettlement.payer?.name || "")}%20chuyen%20tra%20no&accountName=${encodeURIComponent(selectedSettlement.receiver?.bankAccountName || "")}`}
                alt="Mã QR Chuyển khoản"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Account Details Panel */}
            <div className="w-full bg-secondary/20 border border-border p-3 sm:p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-bold text-foreground uppercase">{selectedSettlement.receiver?.bankCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tài khoản:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-foreground">{selectedSettlement.receiver?.bankAccount}</span>
                  <button
                    onClick={() => handleCopy("số tài khoản", selectedSettlement.receiver?.bankAccount || "")}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-secondary/40 rounded-full"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === "số tài khoản" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tên người nhận:</span>
                <span className="font-semibold text-foreground uppercase">{selectedSettlement.receiver?.bankAccountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tiền trả nợ:</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-foreground text-sm">{Number(selectedSettlement.amount).toLocaleString("vi-VN")} đ</span>
                  <button
                    onClick={() => handleCopy("số tiền", String(selectedSettlement.amount))}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-secondary/40 rounded-full"
                    title="Sao chép số tiền"
                  >
                    {copiedField === "số tiền" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nội dung chuyển khoản:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground truncate max-w-[150px]">PT {groupName} {selectedSettlement.payer?.name} chuyen tra no</span>
                  <button
                    onClick={() => handleCopy("nội dung chuyển khoản", `PT ${groupName} ${selectedSettlement.payer?.name} chuyen tra no`)}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-secondary/40 rounded-full"
                    title="Sao chép nội dung"
                  >
                    {copiedField === "nội dung chuyển khoản" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction tooltip for verification */}
            <div className="p-3 bg-muted/40 border-l-2 border-primary text-[10px] text-muted-foreground leading-relaxed w-full rounded-r-xl">
              <ShieldCheck size={14} className="text-primary inline mr-1 shrink-0 align-text-top" />
              Sau khi quét mã và chuyển tiền thành công, hãy yêu cầu <span className="text-foreground font-semibold">{selectedSettlement.receiver?.name}</span> mở ứng dụng và nhấn nút <span className="text-primary font-semibold">&quot;Xác nhận đã nhận&quot;</span> để đóng giao dịch nợ này.
            </div>
          </div>
        ) : (
          /* Receiver has not set up bank account details */
          <div className="w-full flex flex-col items-center py-4">
            <div className="py-8 px-6 text-center border border-dashed border-amber-500/20 bg-amber-500/5 max-w-xs space-y-3 rounded-2xl w-full">
              <TrendingDown size={28} className="text-amber-500 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-amber-500">Chưa thiết lập tài khoản ngân hàng</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {currentUser && selectedSettlement.receiverId === currentUser.id ? (
                  <>Bạn cần cập nhật thông tin tài khoản ngân hàng để hệ thống tự động sinh mã VietQR nhận tiền chuyển khoản.</>
                ) : (
                  <>
                    Người nhận (<span className="text-foreground font-semibold">{selectedSettlement.receiver?.name}</span>) cần cập nhật thông tin tài khoản ngân hàng trong hồ sơ cá nhân để hệ thống sinh mã VietQR.
                  </>
                )}
              </p>
              
              {currentUser && selectedSettlement.receiverId === currentUser.id && (
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DialogTrigger render={
                    <Button
                      className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-full cursor-pointer transition-colors px-5 py-1.5 h-auto"
                    />
                  }>
                    Thiết Lập Ngay
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border rounded-3xl text-foreground w-[92vw] max-w-sm p-4 sm:p-6 shadow-xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-foreground text-left">Cập nhật tài khoản ngân hàng</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground text-left">
                        Cập nhật thông tin ngân hàng của bạn để người khác quét mã VietQR.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-4 py-2 w-full">
                      <div className="space-y-2 text-left">
                        <Label htmlFor="profile-bank-code" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Chọn ngân hàng</Label>
                        <Input
                          type="text"
                          placeholder="Tìm kiếm ngân hàng..."
                          value={profileBankSearch}
                          onChange={(e) => setProfileBankSearch(e.target.value)}
                          disabled={isUpdatingProfile}
                          className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 h-9 text-xs mb-2 focus:border-ring focus:ring-1 focus:ring-ring rounded-full px-4"
                        />
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2 max-h-[140px] overflow-y-auto pr-1 border border-border p-2 bg-background/50 rounded-2xl">
                          {banksList
                            .filter(
                              (b) =>
                                b.shortName.toLowerCase().includes(profileBankSearch.toLowerCase()) ||
                                b.name.toLowerCase().includes(profileBankSearch.toLowerCase()) ||
                                b.code.toLowerCase().includes(profileBankSearch.toLowerCase())
                            )
                            .map((b) => (
                              <BankLogoButton
                                key={b.code}
                                bank={b}
                                isSelected={profileBankCode === b.code}
                                onClick={() => setProfileBankCode(profileBankCode === b.code ? "" : b.code)}
                              />
                            ))}
                          {banksList.filter(
                            (b) =>
                              b.shortName.toLowerCase().includes(profileBankSearch.toLowerCase()) ||
                              b.name.toLowerCase().includes(profileBankSearch.toLowerCase()) ||
                              b.code.toLowerCase().includes(profileBankSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="col-span-3 py-4 text-center text-[10px] text-muted-foreground">
                              Không tìm thấy ngân hàng
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 text-left">
                        <Label htmlFor="profile-bank-acc" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Số tài khoản</Label>
                        <Input
                          id="profile-bank-acc"
                          placeholder="Số tài khoản ngân hàng của bạn"
                          value={profileBankAccount}
                          onChange={(e) => setProfileBankAccount(e.target.value)}
                          disabled={isUpdatingProfile}
                          className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10 w-full rounded-full px-4"
                          required
                        />
                      </div>
                      <div className="space-y-2 text-left">
                        <Label htmlFor="profile-bank-name" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tên chủ tài khoản (KHÔNG DẤU)</Label>
                        <Input
                          id="profile-bank-name"
                          placeholder="Ví dụ: NGUYEN VAN A"
                          value={profileBankAccountName}
                          onChange={(e) => setProfileBankAccountName(e.target.value.toUpperCase())}
                          disabled={isUpdatingProfile}
                          className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10 uppercase w-full rounded-full px-4"
                          required
                        />
                      </div>
                      <DialogFooter className="pt-2 w-full">
                        <Button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="w-full h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
                        >
                          {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : "Lưu Thay Đổi"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="w-full mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full border-border hover:bg-muted text-foreground rounded-full h-10 cursor-pointer text-xs"
          >
            Đóng Cửa Sổ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
