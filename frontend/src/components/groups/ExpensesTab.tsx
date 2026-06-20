import * as React from "react";
import { FileSpreadsheet, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Expense } from "./types";

interface ExpensesTabProps {
  expenses: Expense[];
}

export const ExpensesTab = ({ expenses }: ExpensesTabProps) => {
  return (
    <div className="flex flex-col flex-1 space-y-4">
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border bg-card text-center rounded-3xl shadow-sm">
          <FileSpreadsheet size={40} className="text-muted-foreground/60 mb-3" />
          <h3 className="text-md font-bold text-foreground">Chưa ghi nhận chi tiêu nào</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Bấm nút cộng (+) nổi ở góc dưới hoặc nút &quot;Ghi khoản chi&quot; ở thanh công cụ phía trên để ghi chép hóa đơn ăn uống, vui chơi chung.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((exp) => (
            <Card key={exp.id} className="relative bg-card border border-border rounded-3xl shadow-xs overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              {/* Status bar */}
              <div className={`absolute top-0 left-0 bottom-0 w-[4px] ${
                exp.status === "PENDING" ? "bg-amber-500" : "bg-primary"
              }`} />
              
              <CardContent className="p-5 pl-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{exp.description}</span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold select-none ${
                      exp.status === "PENDING" 
                        ? "border-amber-500/20 text-amber-600 bg-amber-500/5" 
                        : "border-primary/20 text-primary bg-primary/5"
                    }`}>
                      {exp.status === "PENDING" ? "Chưa chốt sổ" : "Đã quyết toán"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {exp.paidBy?.name} chi tiền
                    </span>
                    <span className="text-muted-foreground/45">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(exp.expenseDate).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="text-muted-foreground/45">•</span>
                    <span className="text-[11px]">Chia cho {exp.splits.length} người</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">
                    {Number(exp.amount).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
