import * as React from "react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, CheckCircle, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, UserBalance, DebtTransfer, Settlement, SettlementSession } from "./types";

interface SettlementTabProps {
  balances: UserBalance[];
  estimatedDebts: DebtTransfer[];
  sessions: SettlementSession[];
  selectedSessionDetails: SettlementSession | null;
  handleLoadSessionDetails: (sessionId: string) => Promise<void>;
  handleConfirmPayment: (settlementId: string) => Promise<void>;
  handleShowQrModal: (settlement: Settlement) => void;
  openSettleModal: () => void;
  currentUser: User | null;
}

export const SettlementTab = ({
  balances,
  estimatedDebts,
  sessions,
  selectedSessionDetails,
  handleLoadSessionDetails,
  handleConfirmPayment,
  handleShowQrModal,
  openSettleModal,
  currentUser
}: SettlementTabProps) => {
  return (
    <div className="flex flex-col flex-1 space-y-8">
      {/* Close Session Trigger card */}
      <Card className="bg-gradient-to-r from-card to-secondary/30 border border-border rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
        <div>
          <h3 className="text-md font-bold text-foreground">Chốt Sổ Quỹ Nhóm</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-lg leading-relaxed">
            Chốt sổ tất cả các khoản chi tiêu chưa quyết toán hiện có trong nhóm, tính toán nợ chéo tối giản và tạo phiên thanh toán chuyển khoản VietQR cho từng thành viên.
          </p>
        </div>
        <Button
          onClick={openSettleModal}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full h-10 px-6 cursor-pointer text-xs transition-colors shrink-0"
        >
          Chốt Sổ Kỳ Chi Tiêu
        </Button>
      </Card>

      {/* Subsections: Current running balances & estimated debts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Net Balances */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            Số Dư Hiện Tại (Chưa Chốt)
          </h3>
          <Card className="bg-card border border-border rounded-3xl p-5 divide-y divide-border shadow-xs">
            {balances.map((bal) => (
              <div key={bal.userId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{bal.name}</span>
                  <span className="block text-[10px] text-muted-foreground">{bal.phoneNumber}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {bal.netBalance > 0.01 ? (
                    <>
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-500">
                        +{bal.netBalance.toLocaleString("vi-VN")} đ
                      </span>
                    </>
                  ) : bal.netBalance < -0.01 ? (
                    <>
                      <TrendingDown size={14} className="text-amber-500" />
                      <span className="text-sm font-bold text-amber-500">
                        {bal.netBalance.toLocaleString("vi-VN")} đ
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">0 đ</span>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right: Estimated simplified debts */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={14} className="text-primary" />
            Ước Tính Gom Nợ Tối Giản
          </h3>
          {estimatedDebts.length === 0 ? (
            <div className="p-6 border border-dashed border-border bg-card text-center text-xs text-muted-foreground rounded-3xl shadow-xs">
              Số dư cân bằng. Không có công nợ nào cần chuyển khoản.
            </div>
          ) : (
            <div className="space-y-3">
              {estimatedDebts.map((debt, index) => (
                <Card key={index} className="bg-card border border-border rounded-3xl p-4 flex items-center justify-between shadow-xs">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{debt.fromUserName}</span>
                    <span> nợ </span>
                    <span className="font-semibold text-primary">{debt.toUserName}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {debt.amount.toLocaleString("vi-VN")} đ
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section: Chốt Sổ Sessions history */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Lịch Sử Các Phiên Quyết Toán (Đã Chốt Sổ)
        </h3>
        {sessions.length === 0 ? (
          <div className="p-12 border border-dashed border-border bg-card text-center text-xs text-muted-foreground rounded-3xl shadow-xs">
            Chưa thực hiện phiên chốt sổ nào. Bấm nút &quot;Chốt Sổ Kỳ Chi Tiêu&quot; phía trên để tạo phiên đầu tiên.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const isOpen = selectedSessionDetails?.id === session.id;
              return (
                <div key={session.id} className="border border-border bg-card relative rounded-3xl overflow-hidden shadow-xs">
                  {/* Stripe effect */}
                  <div className={`absolute top-0 left-0 bottom-0 w-[4px] ${
                    session.status === "PENDING" ? "bg-amber-500" : "bg-primary"
                  }`} />

                  <div 
                    onClick={() => handleLoadSessionDetails(session.id)}
                    className="p-5 pl-7 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          Kỳ quyết toán: {new Date(session.startDate).toLocaleDateString("vi-VN")} - {new Date(session.endDate).toLocaleDateString("vi-VN")}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 border rounded-full font-bold select-none uppercase tracking-wider ${
                          session.status === "PENDING"
                            ? "border-amber-500/20 text-amber-600 bg-amber-500/5"
                            : "border-primary/20 text-primary bg-primary/5"
                        }`}>
                          {session.status === "PENDING" ? "Đang thanh toán" : "Hoàn thành"}
                        </span>
                      </div>
                      <span className="block text-[10px] text-muted-foreground">
                        Tạo ngày: {new Date(session.startDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium select-none">
                      {isOpen ? "Ẩn chi tiết" : "Xem chi tiết"}
                    </span>
                  </div>

                  {/* Session details drawer showing Settlements in session */}
                  {isOpen && selectedSessionDetails && (
                    <div className="border-t border-border bg-muted/20 p-5 pl-7 space-y-4">
                      <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Danh sách giao dịch quyết toán công nợ:
                      </h4>
                      <div className="space-y-3">
                        {selectedSessionDetails.settlements?.map((set) => {
                          const isCurrentPayer = currentUser && set.payerId === currentUser.id;
                          const isCurrentReceiver = currentUser && set.receiverId === currentUser.id;

                          return (
                            <div key={set.id} className="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border ${
                                  set.status === "COMPLETED" 
                                    ? "border-primary/10 bg-primary/5 text-primary" 
                                    : "border-amber-500/10 bg-amber-500/5 text-amber-500"
                                }`}>
                                  {set.status === "COMPLETED" ? <CheckCircle size={16} /> : <QrCode size={16} />}
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">{set.payer?.name}</span>
                                    <span> trả cho </span>
                                    <span className="font-semibold text-primary">{set.receiver?.name}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-1">
                                    Số tiền: <span className="font-bold text-foreground">{Number(set.amount).toLocaleString("vi-VN")} đ</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                                {set.status === "COMPLETED" ? (
                                  <span className="text-xs text-primary font-semibold flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    Đã nhận tiền
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {/* Action buttons */}
                                    <Button
                                      onClick={() => handleShowQrModal(set)}
                                      variant="outline"
                                      className="w-full sm:w-auto h-8 border-border hover:bg-muted text-foreground text-xs font-semibold rounded-full cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <QrCode size={12} />
                                      Quét Mã QR
                                    </Button>
                                    
                                    {/* Confirm Payment button shown only for Creditor (receiver) */}
                                    {isCurrentReceiver && (
                                      <Button
                                        onClick={() => handleConfirmPayment(set.id)}
                                        className="w-full sm:w-auto h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-full cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        <CheckCircle size={12} />
                                        Xác nhận đã nhận
                                      </Button>
                                    )}

                                    {isCurrentPayer && !isCurrentReceiver && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 px-2.5 py-1 bg-amber-500/5 border border-amber-500/10 rounded-full select-none">
                                        Chờ xác nhận
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
