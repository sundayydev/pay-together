"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  User,
  LogOut, 
  Copy, 
  Check, 
  Compass, 
  Loader2,
  ArrowRight,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

interface Group {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
}

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  bankCode?: string | null;
  bankAccount?: string | null;
  bankAccountName?: string | null;
}

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

interface BankLogoButtonProps {
  bank: { code: string; shortName: string; name: string; logoUrl?: string };
  isSelected: boolean;
  onClick: () => void;
}

const BankLogoButton = ({ bank, isSelected, onClick }: BankLogoButtonProps) => {
  const [imgError, setImgError] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 border rounded-xl text-center transition-all cursor-pointer h-[68px] ${
        isSelected
          ? "border-primary bg-primary/5 shadow-xs"
          : "border-border bg-background hover:border-muted-foreground/30"
      }`}
    >
      <div className={`w-10 h-6 flex items-center justify-center overflow-hidden mb-1 px-1 ${imgError ? 'bg-muted border border-border' : 'bg-white'}`}>
        {imgError ? (
          <span className="text-[9px] font-bold text-muted-foreground uppercase truncate">
            {bank.shortName}
          </span>
        ) : (
          <img
            src={bank.logoUrl || `https://api.vietqr.io/img/${bank.code}.png`}
            alt={bank.shortName}
            className="max-w-full max-h-full object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <span className="text-[9px] font-semibold text-muted-foreground truncate max-w-full">
        {bank.shortName}
      </span>
    </button>
  );
};

export default function DashboardPage() {
  const router = useRouter();
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
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // States cho modal Tạo Nhóm
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newGroupDesc, setNewGroupDesc] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // States cho modal Tham Gia Nhóm
  const [isJoinOpen, setIsJoinOpen] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState("");
  const [isJoining, setIsJoining] = React.useState(false);

  // States cho modal Cập nhật Hồ Sơ
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [profileName, setProfileName] = React.useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = React.useState("");
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

  const fetchGroups = React.useCallback(async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.clear();
        router.push("/login");
        return;
      }

      if (!response.ok || !data.result) {
        throw new Error(data.message || "Không thể tải danh sách nhóm.");
      }

      setGroups(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi kết nối máy chủ.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setTimeout(() => {
        setUser(parsedUser);
        setProfileName(parsedUser.name || "");
        setProfileAvatarUrl(parsedUser.avatarUrl || "");
        setProfileBankCode(parsedUser.bankCode || "");
        setProfileBankAccount(parsedUser.bankAccount || "");
        setProfileBankAccountName(parsedUser.bankAccountName || "");
        fetchGroups(token);
      }, 0);
    } catch {
      localStorage.clear();
      router.push("/login");
    }
  }, [mounted, router, fetchGroups]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Đã đăng xuất.");
    router.push("/login");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

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
            name: profileName.trim(),
            avatarUrl: profileAvatarUrl.trim() || null,
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

      toast.success("Cập nhật thông tin tài khoản thành công!");
      
      const updatedUser: User = {
        id: user?.id || "",
        phoneNumber: user?.phoneNumber || "",
        name: data.data.name,
        avatarUrl: data.data.avatarUrl,
        bankCode: data.data.bankCode,
        bankAccount: data.data.bankAccount,
        bankAccountName: data.data.bankAccountName,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsProfileOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật.";
      toast.error(message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsCreating(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDesc || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(data.message || "Tạo nhóm thất bại.");
      }

      toast.success(`Đã tạo nhóm "${data.data.name}" thành công!`);
      setNewGroupName("");
      setNewGroupDesc("");
      setIsCreateOpen(false);
      
      // Tải lại danh sách nhóm
      fetchGroups(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo nhóm.";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Vui lòng nhập mã mời.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsJoining(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/groups/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inviteCode: inviteCode.trim().toUpperCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(data.message || "Tham gia nhóm thất bại.");
      }

      toast.success("Tham gia nhóm thành công!");
      setInviteCode("");
      setIsJoinOpen(false);
      
      // Tải lại danh sách nhóm
      fetchGroups(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mã mời không đúng hoặc bạn đã là thành viên.";
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click thẻ Card chuyển hướng
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã sao chép mã mời!");
    setTimeout(() => setCopiedId(null), 2000);
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

      {/* Decorative Glow Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center font-bold text-primary-foreground text-xl rounded-full">
            P
          </div>
          <span className="text-lg font-semibold tracking-wider text-foreground">PayTogether</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-muted/60 p-1 border border-border rounded-full mr-1">
              <button
                type="button"
                onClick={() => changeTheme("green")}
                className={`w-5 h-5 rounded-full bg-[#10b981] hover:scale-110 transition-transform cursor-pointer ${theme === "green" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                title="Theme Xanh lá"
              />
              <button
                type="button"
                onClick={() => changeTheme("blue")}
                className={`w-5 h-5 rounded-full bg-[#3b82f6] hover:scale-110 transition-transform cursor-pointer ${theme === "blue" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                title="Theme Xanh dương"
              />
              <button
                type="button"
                onClick={() => changeTheme("yellow")}
                className={`w-5 h-5 rounded-full bg-[#f59e0b] hover:scale-110 transition-transform cursor-pointer ${theme === "yellow" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                title="Theme Trắng vàng"
              />
              <button
                type="button"
                onClick={() => changeTheme("pink")}
                className={`w-5 h-5 rounded-full bg-[#ec4899] hover:scale-110 transition-transform cursor-pointer ${theme === "pink" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                title="Theme Hồng"
              />
              <button
                type="button"
                onClick={() => changeTheme("dark")}
                className={`w-5 h-5 rounded-full bg-[#18181b] hover:scale-110 transition-transform cursor-pointer ${theme === "dark" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                title="Theme Tối (Dark)"
              />
            </div>
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="w-9 h-9 rounded-full object-cover border border-border hidden sm:block shrink-0" 
              />
            ) : (
              <div className="w-9 h-9 bg-muted border border-border flex items-center justify-center text-muted-foreground rounded-full hidden sm:flex shrink-0 select-none">
                <User size={16} />
              </div>
            )}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.phoneNumber}</span>
            </div>

            {/* Modal: Cập Nhật Hồ Sơ & Tài Khoản Ngân Hàng */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger render={
                <button
                  className="p-2 border border-border hover:border-muted-foreground/30 bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer rounded-full transition-colors"
                  title="Cập nhật tài khoản ngân hàng"
                />
              }>
                <Settings size={16} />
              </DialogTrigger>
              <DialogContent className="bg-card border-border rounded-3xl text-foreground w-[92vw] max-w-sm p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground">Cập nhật tài khoản</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Cập nhật họ tên và tài khoản ngân hàng để tự động nhận tiền quyết toán qua mã VietQR.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4 py-2">
                  {/* Mobile Theme Selector (shown inside Settings modal on mobile only) */}
                  <div className="space-y-2 sm:hidden border-b border-border pb-4 mb-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Chọn Giao Diện (Theme)</Label>
                    <div className="flex items-center gap-3 bg-muted/40 p-1.5 border border-border rounded-full w-fit mt-1">
                      <button
                        type="button"
                        onClick={() => changeTheme("green")}
                        className={`w-6 h-6 rounded-full bg-[#10b981] hover:scale-110 transition-transform cursor-pointer ${theme === "green" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        title="Theme Xanh lá"
                      />
                      <button
                        type="button"
                        onClick={() => changeTheme("blue")}
                        className={`w-6 h-6 rounded-full bg-[#3b82f6] hover:scale-110 transition-transform cursor-pointer ${theme === "blue" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        title="Theme Xanh dương"
                      />
                      <button
                        type="button"
                        onClick={() => changeTheme("yellow")}
                        className={`w-6 h-6 rounded-full bg-[#f59e0b] hover:scale-110 transition-transform cursor-pointer ${theme === "yellow" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        title="Theme Trắng vàng"
                      />
                      <button
                        type="button"
                        onClick={() => changeTheme("pink")}
                        className={`w-6 h-6 rounded-full bg-[#ec4899] hover:scale-110 transition-transform cursor-pointer ${theme === "pink" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        title="Theme Hồng"
                      />
                      <button
                        type="button"
                        onClick={() => changeTheme("dark")}
                        className={`w-6 h-6 rounded-full bg-[#18181b] hover:scale-110 transition-transform cursor-pointer ${theme === "dark" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        title="Theme Tối (Dark)"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-name" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Họ và Tên</Label>
                    <Input
                      id="profile-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      disabled={isUpdatingProfile}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-avatar" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ảnh Đại Diện (Avatar URL)</Label>
                    <Input
                      id="profile-avatar"
                      placeholder="https://example.com/avatar.png"
                      value={profileAvatarUrl}
                      onChange={(e) => setProfileAvatarUrl(e.target.value)}
                      disabled={isUpdatingProfile}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-bank-code" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Chọn ngân hàng</Label>
                    <Input
                      type="text"
                      placeholder="Tìm kiếm ngân hàng..."
                      value={profileBankSearch}
                      onChange={(e) => setProfileBankSearch(e.target.value)}
                      disabled={isUpdatingProfile}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 h-9 text-xs mb-2 focus:border-ring focus:ring-1 focus:ring-ring"
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
                  <div className="space-y-2">
                    <Label htmlFor="profile-bank-acc" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Số tài khoản</Label>
                    <Input
                      id="profile-bank-acc"
                      placeholder="Số tài khoản ngân hàng của bạn"
                      value={profileBankAccount}
                      onChange={(e) => setProfileBankAccount(e.target.value)}
                      disabled={isUpdatingProfile}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-bank-name" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tên chủ tài khoản (KHÔNG DẤU)</Label>
                    <Input
                      id="profile-bank-name"
                      placeholder="Ví dụ: NGUYEN VAN A"
                      value={profileBankAccountName}
                      onChange={(e) => setProfileBankAccountName(e.target.value.toUpperCase())}
                      disabled={isUpdatingProfile}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10 uppercase"
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full h-10"
                    >
                      {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : "Lưu Thay Đổi"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleLogout}
              className="p-2 border border-border hover:border-muted-foreground/30 bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer rounded-full transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Main Dashboard Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col">
        {/* Banner Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Quỹ Chi Tiêu Nhóm</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Quản lý các nhóm chi tiêu chung, chia tiền và chốt sổ nhanh gọn.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Modal: Tham gia nhóm */}
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger render={
                <Button
                  variant="outline"
                  className="flex-1 md:flex-initial h-10 border-border bg-background hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer"
                />
              }>
                <Compass size={16} />
                Tham Gia Nhóm
              </DialogTrigger>
              <DialogContent className="bg-card border-border rounded-3xl text-foreground max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground">Tham gia bằng mã mời</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Nhập mã mời gồm 6 ký tự để tham gia nhóm chi tiêu chung.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinGroup} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mã Mời (Invite Code)</Label>
                    <Input
                      id="code"
                      placeholder="ABCXYZ"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      disabled={isJoining}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring text-center tracking-widest font-mono text-lg"
                      maxLength={8}
                      required
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      disabled={isJoining}
                      className="w-full h-10"
                    >
                      {isJoining ? <Loader2 size={16} className="animate-spin" /> : "Tham Gia Nhóm"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Modal: Tạo nhóm mới */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger render={
                <Button
                  className="flex-1 md:flex-initial h-10"
                />
              }>
                <Plus size={16} />
                Tạo Nhóm Mới
              </DialogTrigger>
              <DialogContent className="bg-card border-border rounded-3xl text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground">Tạo nhóm chi tiêu mới</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Nhóm mới giúp ghi chép lịch sử chi tiêu, phân bổ và quyết toán.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="group-name" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tên Nhóm</Label>
                    <Input
                      id="group-name"
                      placeholder="e.g. Căn Hộ 402, Du Hý Đà Lạt..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      disabled={isCreating}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-desc" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mô tả ngắn (tùy chọn)</Label>
                    <Input
                      id="group-desc"
                      placeholder="e.g. Quỹ ăn uống, sinh hoạt chung..."
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      disabled={isCreating}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-10"
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="w-full h-10"
                    >
                      {isCreating ? <Loader2 size={16} className="animate-spin" /> : "Xác Nhận Tạo Nhóm"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Group Grid Content */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[180px] bg-card border border-border rounded-3xl animate-pulse relative shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted rounded-t-3xl" />
                <div className="p-6 space-y-4">
                  <div className="h-6 w-1/2 bg-muted rounded-full" />
                  <div className="h-4 w-5/6 bg-muted/65 rounded-full" />
                  <div className="h-8 w-1/3 bg-muted/65 mt-4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 border border-dashed border-border bg-card/40 backdrop-blur-xs text-center max-w-xl mx-auto w-full rounded-3xl shadow-sm">
            <Compass size={48} className="text-muted-foreground/60 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Chưa tham gia nhóm nào</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              Hãy bắt đầu bằng cách tạo một nhóm mới hoặc tham gia nhóm hiện có thông qua mã mời.
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setIsJoinOpen(true)}
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground cursor-pointer text-xs"
              >
                Nhập Mã Mời
              </Button>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="text-xs"
              >
                Tạo Nhóm Mới
              </Button>
            </div>
          </div>
        ) : (
          /* Responsive Group List */
          <div>
            {/* Desktop: Group Cards Grid */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div 
                  key={group.id}
                  onClick={() => router.push(`/groups?id=${group.id}`)}
                  className="relative border border-border bg-card hover:border-primary/30 shadow-xs group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between rounded-3xl overflow-hidden"
                >
                  {/* Subtle top primary line that expands on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted rounded-t-3xl group-hover:bg-primary transition-all duration-300" />
                  
                  <div className="p-6 pb-5 flex items-start gap-4">
                    {/* Compact Avatar/Icon with gradient background */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary flex items-center justify-center font-bold text-lg uppercase shrink-0 border border-primary/10 shadow-xs group-hover:scale-105 transition-all duration-300">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                        {group.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 min-h-[32px] leading-relaxed">
                        {group.description || "Không có mô tả chi tiết."}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Mã Mời nhóm</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono font-bold text-foreground bg-secondary/60 px-2.5 py-0.5 border border-border/80 rounded-lg select-all">
                          {group.inviteCode}
                        </code>
                        <button
                          onClick={(e) => copyToClipboard(e, group.id, group.inviteCode)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-full cursor-pointer transition-colors"
                          title="Sao chép mã"
                        >
                          {copiedId === group.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      <span>Vào nhóm</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1 duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: Compact List Row View */}
            <div className="flex sm:hidden flex-col gap-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => router.push(`/groups?id=${group.id}`)}
                  className="flex items-center justify-between p-3.5 bg-card border border-border rounded-2xl active:scale-[0.98] active:bg-secondary/30 transition-all duration-200 cursor-pointer shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Compact Avatar/Icon with gradient bg */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0 border border-primary/10 shadow-xs">
                      {group.name.charAt(0)}
                    </div>
                    {/* Group Name & Description */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate">{group.name}</h4>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {group.description || "Không có mô tả chi tiết."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {/* Copyable invite code badge */}
                    <div 
                      onClick={(e) => copyToClipboard(e, group.id, group.inviteCode)}
                      className="flex items-center gap-1 bg-muted hover:bg-muted/80 text-foreground border border-border px-2 py-1 rounded-full cursor-pointer transition-colors active:scale-95"
                      title="Sao chép mã mời"
                    >
                      <code className="text-[10px] font-mono font-bold tracking-wider">
                        {group.inviteCode}
                      </code>
                      {copiedId === group.id ? (
                        <Check size={10} className="text-emerald-500" />
                      ) : (
                        <Copy size={10} className="text-muted-foreground" />
                      )}
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Toaster theme="light" position="top-right" richColors closeButton />
    </div>
  );
}
