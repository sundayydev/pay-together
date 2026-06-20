"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { 
  User, 
  Group, 
  Expense, 
  UserBalance, 
  DebtTransfer, 
  Settlement, 
  SettlementSession 
} from "@/components/groups/types";

import { ExpensesTab } from "@/components/groups/ExpensesTab";
import { MembersTab } from "@/components/groups/MembersTab";
import { SettlementTab } from "@/components/groups/SettlementTab";
import { NewExpenseDialog } from "@/components/groups/NewExpenseDialog";
import { SettlePeriodDialog } from "@/components/groups/SettlePeriodDialog";
import { QrPaymentDialog } from "@/components/groups/QrPaymentDialog";
import { GroupHeader } from "@/components/groups/GroupHeader";
import { GroupTabSelector } from "@/components/groups/GroupTabSelector";
import { GroupStateViews } from "@/components/groups/GroupStateViews";

const POPULAR_BANKS = [
  { code: "MB", shortName: "MB", name: "Ngân hàng Quân Đội" },
  { code: "VCB", shortName: "Vietcombank", name: "Ngân hàng Ngoại thương Việt Nam" },
  { code: "TCB", shortName: "Techcombank", name: "Ngân hàng Kỹ thương Việt Nam" },
  { code: "CTG", shortName: "VietinBank", name: "Ngân hàng Công thương Việt Nam" },
  { code: "BIDV", shortName: "BIDV", name: "Ngân hàng Đầu tư và Phát triển Việt Nam" },
  { code: "ACB", shortName: "ACB", name: "Ngân hàng Á Châu" },
  { code: "VPB", shortName: "VPBank", name: "Ngân hàng Thịnh vượng và Phát triển" },
  { code: "STB", shortName: "Sacombank", name: "Ngân hàng Sài Gòn Thương Tín" },
  { code: "TPB", shortName: "TPBank", name: "Ngân hàng Tiên Phong" },
  { code: "VIB", shortName: "VIB", name: "Ngân hàng Quốc tế" },
  { code: "HDB", shortName: "HDBank", name: "Ngân hàng Phát triển TP.HCM" },
  { code: "SHB", shortName: "SHB", name: "Ngân hàng Sài Gòn - Hà Nội" },
];

export default function GroupDetailsPage() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const groupId = searchParams.get("id") || "";

  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<string>("green");



  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const root = document.documentElement;
    root.classList.remove("theme-green", "theme-blue", "theme-yellow", "theme-pink", "theme-dark", "dark");
    root.classList.add(`theme-${newTheme}`);
    if (newTheme === "dark") {
      root.classList.add("dark");
    }
  };
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  
  // Trạng thái dữ liệu nhóm
  const [group, setGroup] = React.useState<Group | null>(null);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [balances, setBalances] = React.useState<UserBalance[]>([]);
  const [estimatedDebts, setEstimatedDebts] = React.useState<DebtTransfer[]>([]);
  const [sessions, setSessions] = React.useState<SettlementSession[]>([]);
  const [selectedSessionDetails, setSelectedSessionDetails] = React.useState<SettlementSession | null>(null);

  // Trạng thái chung
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"expenses" | "members" | "settlement">("expenses");
  const [copied, setCopied] = React.useState(false);

  // Modal Tạo chi tiêu mới (Expense)
  const [isExpenseOpen, setIsExpenseOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [paidById, setPaidById] = React.useState("");
  const [selectedParticipants, setSelectedParticipants] = React.useState<string[]>([]);
  const [isSavingExpense, setIsSavingExpense] = React.useState(false);

  // Modal Chốt sổ (Settle up)
  const [isSettleOpen, setIsSettleOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [isSettlingPeriod, setIsSettlingPeriod] = React.useState(false);

  // Modal quét mã QR chuyển tiền
  const [isQrOpen, setIsQrOpen] = React.useState(false);
  const [selectedSettlement, setSelectedSettlement] = React.useState<Settlement | null>(null);

  // States cho modal Cập nhật ngân hàng ngay trong trang
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [profileBankCode, setProfileBankCode] = React.useState("");
  const [profileBankAccount, setProfileBankAccount] = React.useState("");
  const [profileBankAccountName, setProfileBankAccountName] = React.useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [banksList, setBanksList] = React.useState(POPULAR_BANKS);
  const [profileBankSearch, setProfileBankSearch] = React.useState("");

  React.useEffect(() => {
    const fetchBanks = async () => {
      try {
        const host = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const response = await fetch(`${host}/api/banks`);
        const data = await response.json();
        if (response.ok && data.result && Array.isArray(data.data)) {
          setBanksList(data.data);
        }
      } catch {
        // use fallback
      }
    };
    fetchBanks();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const savedTheme = localStorage.getItem("theme") || "green";
      setTheme(savedTheme);
      const root = document.documentElement;
      root.classList.remove("theme-green", "theme-blue", "theme-yellow", "theme-pink", "theme-dark", "dark");
      root.classList.add(`theme-${savedTheme}`);
      if (savedTheme === "dark") {
        root.classList.add("dark");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !groupId) return;

    try {
      setIsLoading(true);
      const host = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

      // 1. Tải chi tiết nhóm và thành viên
      const groupRes = await fetch(`${host}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const groupData = await groupRes.json();
      if (groupRes.status === 401) {
        localStorage.clear();
        router.push("/login");
        return;
      }
      if (groupRes.ok && groupData.result) {
        setGroup(groupData.data);
      }

      // 2. Tải lịch sử chi tiêu
      const expensesRes = await fetch(`${host}/api/groups/${groupId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const expensesData = await expensesRes.json();
      if (expensesRes.ok && expensesData.result) {
        setExpenses(expensesData.data);
      }

      // 3. Tải dự toán số dư & nợ ròng hiện tại
      const balancesRes = await fetch(`${host}/api/groups/${groupId}/balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const balancesData = await balancesRes.json();
      if (balancesRes.ok && balancesData.result) {
        setBalances(balancesData.data.balances);
        setEstimatedDebts(balancesData.data.debts);
      }

      // 4. Tải lịch sử các phiên chốt sổ
      const sessionsRes = await fetch(`${host}/api/groups/${groupId}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sessionsData = await sessionsRes.json();
      if (sessionsRes.ok && sessionsData.result) {
        setSessions(sessionsData.data);
      }

    } catch {
      toast.error("Không thể kết nối với máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, router]);

  React.useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setTimeout(() => {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      setProfileBankCode(parsedUser.bankCode || "");
      setProfileBankAccount(parsedUser.bankAccount || "");
      setProfileBankAccountName(parsedUser.bankAccountName || "");
      fetchData();
    }, 0);
  }, [mounted, groupId, router, fetchData]);

  const handleCopyInvite = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    toast.success("Đã sao chép mã mời!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Mở modal tạo chi tiêu, thiết lập mặc định
  const openExpenseModal = () => {
    if (!group || !currentUser) return;
    setAmount("");
    setDescription("");
    setPaidById(currentUser.id);
    setSelectedParticipants(group.members?.map((m) => m.userId) || []);
    setIsExpenseOpen(true);
  };

  // Tạo khoản chi mới
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !group) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Số tiền không hợp lệ.");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng điền mô tả chi tiêu.");
      return;
    }
    if (selectedParticipants.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người tham gia chia tiền.");
      return;
    }

    setIsSavingExpense(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/groups/${groupId}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            paidById,
            amount: numAmount,
            description: description.trim(),
            splits: selectedParticipants.map(userId => ({ userId })) // Auto Equal Split
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(data.message || "Tạo chi tiêu thất bại.");
      }

      toast.success("Đã ghi nhận khoản chi tiêu thành công!");
      setIsExpenseOpen(false);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi lưu chi tiêu.";
      toast.error(message);
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Tải chi tiết phiên chốt sổ khi mở rộng
  const handleLoadSessionDetails = async (sessionId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (selectedSessionDetails && selectedSessionDetails.id === sessionId) {
      setSelectedSessionDetails(null);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/groups/${groupId}/sessions/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (response.ok && data.result) {
        setSelectedSessionDetails(data.data);
      }
    } catch {
      toast.error("Lỗi tải chi tiết phiên chốt sổ.");
    }
  };

  // Mở modal Chốt Sổ, thiết lập ngày mặc định dựa trên các khoản chi tiêu PENDING
  const openSettleModal = () => {
    const pendingExps = expenses.filter(e => e.status === "PENDING");
    if (pendingExps.length === 0) {
      toast.info("Tất cả các khoản chi tiêu trong nhóm đã được quyết toán.");
      return;
    }

    // Lấy ngày nhỏ nhất và ngày lớn nhất
    const dates = pendingExps.map(e => new Date(e.expenseDate).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date();

    setStartDate(minDate.toISOString().split("T")[0]);
    setEndDate(maxDate.toISOString().split("T")[0]);
    setIsSettleOpen(true);
  };

  // Thực hiện Chốt Sổ (Tạo phiên quyết toán mới)
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsSettlingPeriod(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/groups/${groupId}/settle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(`${endDate}T23:59:59.999Z`).toISOString(),
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(data.message || "Chốt sổ thất bại.");
      }

      toast.success("Phiên chốt sổ và danh sách công nợ quyết toán đã được tạo!");
      setIsSettleOpen(false);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi tạo phiên quyết toán.";
      toast.error(message);
    } finally {
      setIsSettlingPeriod(false);
    }
  };

  // Xác nhận đã nhận tiền (Dành cho Creditor)
  const handleConfirmPayment = async (settlementId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/groups/${groupId}/settlements/${settlementId}/confirm`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok || !data.result) {
        throw new Error(data.message || "Xác nhận thất bại.");
      }

      toast.success("Đã xác nhận nhận tiền thành công!");
      fetchData();
      
      // Cập nhật lại chi tiết phiên đang xem
      if (selectedSessionDetails) {
        const updatedSettlements = selectedSessionDetails.settlements?.map(s => {
          if (s.id === settlementId) return { ...s, status: "COMPLETED" as const };
          return s;
        });
        setSelectedSessionDetails({
          ...selectedSessionDetails,
          settlements: updatedSettlements
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi xác nhận giao dịch.";
      toast.error(message);
    }
  };

  // Hiển thị modal QR chuyển khoản
  const handleShowQrModal = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setIsQrOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !currentUser) return;

    setIsUpdatingProfile(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl || null,
            bankCode: profileBankCode.trim() || null,
            bankAccount: profileBankAccount.trim() || null,
            bankAccountName: profileBankAccountName.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(data.message || "Cập nhật hồ sơ thất bại.");
      }

      toast.success("Cập nhật thông tin ngân hàng thành công!");

      const updatedUser: User = {
        id: currentUser.id,
        name: currentUser.name,
        phoneNumber: currentUser.phoneNumber,
        avatarUrl: data.data.avatarUrl,
        bankCode: data.data.bankCode,
        bankAccount: data.data.bankAccount,
        bankAccountName: data.data.bankAccountName,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setIsProfileOpen(false);
      
      // Reload page data
      fetchData();
      
      // Update selectedSettlement context to render new QR image
      if (selectedSettlement) {
        setSelectedSettlement({
          ...selectedSettlement,
          receiver: {
            id: selectedSettlement.receiver?.id || "",
            name: selectedSettlement.receiver?.name || "",
            phoneNumber: selectedSettlement.receiver?.phoneNumber || "",
            bankCode: data.data.bankCode,
            bankAccount: data.data.bankAccount,
            bankAccountName: data.data.bankAccountName,
          }
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật.";
      toast.error(message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Background Dot Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none" 
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Header Banner */}
      <GroupHeader
        group={group}
        copied={copied}
        theme={theme}
        changeTheme={changeTheme}
        handleCopyInvite={handleCopyInvite}
        openExpenseModal={openExpenseModal}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col">
        <GroupStateViews
          isLoading={isLoading}
          group={group}
          onBackToDashboard={() => router.push("/")}
        >
          {group && (
            <div className="flex flex-col flex-1">
              {/* Tabs Header */}
              <GroupTabSelector
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                expensesCount={expenses.length}
                membersCount={group.members?.length || 0}
              />

              {/* Tab: EXPENSES */}
              {activeTab === "expenses" && (
                <ExpensesTab expenses={expenses} />
              )}

              {/* Tab: MEMBERS */}
              {activeTab === "members" && (
                <MembersTab members={group.members} />
              )}

              {/* Tab: SETTLEMENT / CLOSE SESSION */}
              {activeTab === "settlement" && (
                <SettlementTab
                  balances={balances}
                  estimatedDebts={estimatedDebts}
                  sessions={sessions}
                  selectedSessionDetails={selectedSessionDetails}
                  handleLoadSessionDetails={handleLoadSessionDetails}
                  handleConfirmPayment={handleConfirmPayment}
                  handleShowQrModal={handleShowQrModal}
                  openSettleModal={openSettleModal}
                  currentUser={currentUser}
                />
              )}
            </div>
          )}
        </GroupStateViews>
      </main>

      {/* Dialog: Ghi nhận chi tiêu mới */}
      <NewExpenseDialog
        isOpen={isExpenseOpen}
        onOpenChange={setIsExpenseOpen}
        amount={amount}
        setAmount={setAmount}
        description={description}
        setDescription={setDescription}
        paidById={paidById}
        setPaidById={setPaidById}
        selectedParticipants={selectedParticipants}
        toggleParticipant={toggleParticipant}
        members={group?.members}
        isSavingExpense={isSavingExpense}
        handleSaveExpense={handleSaveExpense}
      />

      {/* Dialog: Chốt sổ */}
      <SettlePeriodDialog
        isOpen={isSettleOpen}
        onOpenChange={setIsSettleOpen}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        isSettlingPeriod={isSettlingPeriod}
        handleCreateSession={handleCreateSession}
      />

      {/* Dialog: Quét mã QR chuyển khoản */}
      <QrPaymentDialog
        isOpen={isQrOpen}
        onOpenChange={setIsQrOpen}
        selectedSettlement={selectedSettlement}
        groupName={group?.name || ""}
        currentUser={currentUser}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        profileBankCode={profileBankCode}
        setProfileBankCode={setProfileBankCode}
        profileBankAccount={profileBankAccount}
        setProfileBankAccount={setProfileBankAccount}
        profileBankAccountName={profileBankAccountName}
        setProfileBankAccountName={setProfileBankAccountName}
        isUpdatingProfile={isUpdatingProfile}
        banksList={banksList}
        profileBankSearch={profileBankSearch}
        setProfileBankSearch={setProfileBankSearch}
        handleUpdateProfile={handleUpdateProfile}
      />

      {/* Floating Action Button (FAB) for mobile to Ghi Khoản Chi */}
      {!isLoading && group && (
        <button
          onClick={openExpenseModal}
          className="fixed bottom-6 right-6 z-50 flex sm:hidden items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-none"
          title="Ghi khoản chi mới"
        >
          <Plus size={24} />
        </button>
      )}

      <Toaster theme="light" position="top-right" richColors closeButton />
    </div>
  );
}
