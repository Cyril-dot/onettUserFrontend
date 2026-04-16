import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import SkeletonList from "@/components/SkeletonList";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { userApi, productRequestApi, userProductApi } from "@/lib/api";
import {
  Loader2, Camera, Edit2, X, Check, Mail, Phone, MapPin,
  Send, Upload, RefreshCw, Package, ShoppingBag, Clock,
  CheckCircle, XCircle, Shield, Plus, FileText, ChevronLeft,
  ChevronRight, User, Sparkles, Image as ImageIcon, Banknote,
  ArrowRight, Info, Star, TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "profile" | "request" | "my-requests" | "my-products";
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type RequestStep = "pay" | "submit" | "done";

interface ProductRequest {
  id: string;
  paid: boolean;
  amount: number;
  senderAccountName: string;
  senderPhoneNumber: string;
  screenshotUrl: string;
  approvalStatus: ApprovalStatus;
  hasProduct: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProduct {
  id: string;
  name: string;
  brand: string;
  productDescription: string;
  approvalStatus: ApprovalStatus;
  updateCount: number;
  images: { id: number; imageUrl: string; displayOrder: number }[];
  createdAt: string;
}

interface RequestProductResponse {
  userId: string;
  name: string;
  email: string;
  productResponse: UserProduct | null;
  payload: ProductRequest | null;
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

const statusConfig: Record<ApprovalStatus, { label: string; icon: React.ReactNode; bg: string; text: string; dot: string }> = {
  PENDING:  { label: "Pending",  icon: <Clock size={10} />,        bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
  APPROVED: { label: "Approved", icon: <CheckCircle size={10} />,  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  REJECTED: { label: "Rejected", icon: <XCircle size={10} />,      bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400" },
};

const StatusPill = ({ status }: { status: ApprovalStatus }) => {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) => (
  <div className="relative bg-white rounded-2xl border border-slate-100 p-4 overflow-hidden group hover:border-orange-200 hover:shadow-sm transition-all duration-200">
    <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[40px] ${accent} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
    <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
    <p className="text-[11px] text-slate-400 font-medium mt-1">{label}</p>
  </div>
);

// ─── Profile Tab ─────────────────────────────────────────────────────────────

const ProfileTab = ({ user, refreshProfile }: { user: any; refreshProfile: () => Promise<void> }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        location: user.location || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(form)], { type: "application/json" }));
      if (profilePic) fd.append("profilePic", profilePic);
      await userApi.updateProfile(fd);
      await refreshProfile();
      setEditing(false);
      setPicPreview(null);
      setProfilePic(null);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onPicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setProfilePic(f);
    if (f) setPicPreview(URL.createObjectURL(f));
  };

  const initials = user?.fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 relative">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)`
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/10 to-transparent" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center shadow-lg overflow-hidden">
                {picPreview ? (
                  <img src={picPreview} className="w-full h-full object-cover" alt="preview" />
                ) : user?.profilePic?.imageUrl ? (
                  <img src={user.profilePic.imageUrl} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <span className="text-2xl font-black text-orange-500">{initials}</span>
                )}
              </div>
              {editing && (
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-sm">
                  <Camera size={12} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={onPicChange} />
                </label>
              )}
            </div>

            {/* Actions */}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all"
              >
                <Edit2 size={13} /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(false); setPicPreview(null); setProfilePic(null); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-400 text-xs font-medium hover:bg-slate-50 transition-all"
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-60 transition-all shadow-sm"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-slate-800">{user?.fullName}</h2>
                {user?.approvalStatus === "APPROVED" && (
                  <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                {user?.bio || <em className="text-slate-300">No bio added yet</em>}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { icon: <Mail size={14} className="text-orange-400" />, val: user?.email, label: "Email" },
                  { icon: <Phone size={14} className="text-orange-400" />, val: user?.phoneNumber || "Not set", label: "Phone" },
                  { icon: <MapPin size={14} className="text-orange-400" />, val: user?.location || "Not set", label: "Location" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">{f.label}</p>
                      <p className="text-sm text-slate-600 font-medium">{f.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Name", key: "fullName", placeholder: "Your full name" },
                { label: "Phone Number", key: "phoneNumber", placeholder: "+233 XX XXX XXXX" },
                { label: "Location", key: "location", placeholder: "City, Country" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
                  <Input
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="h-10 text-sm rounded-xl border-slate-200 focus:border-orange-300 focus:ring-orange-100"
                  />
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bio</Label>
                <Textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell the world about yourself..."
                  className="text-sm rounded-xl border-slate-200 focus:border-orange-300 focus:ring-orange-100 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Account Info</h3>
        <div className="space-y-3">
          {[
            { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—" },
            { label: "Account Type", value: "Buyer / Requester" },
            { label: "Email Verified", value: user?.emailVerified ? "Verified ✓" : "Not verified" },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-400">{row.label}</span>
              <span className="text-sm font-semibold text-slate-700">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Request Product Tab (MoMo Flow) ─────────────────────────────────────────

const RequestProductTab = () => {
  const [step, setStep] = useState<RequestStep>("pay");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [paidRequestId, setPaidRequestId] = useState<string | null>(null);

  // Payment form
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);

  // Product form
  const [productForm, setProductForm] = useState({ name: "", brand: "", productDescription: "" });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // AI description generator
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const onScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setScreenshot(f);
    if (f) setScreenshotPreview(URL.createObjectURL(f));
  };

  const handlePaymentSubmit = async () => {
    if (!senderName.trim()) return toast.error("Sender name is required.");
    if (!senderPhone.trim()) return toast.error("Sender phone number is required.");
    if (!screenshot) return toast.error("Payment screenshot is required.");

    setSubmittingPayment(true);
    try {
      const fd = new FormData();
      fd.append("senderAccountName", senderName);
      fd.append("senderPhoneNumber", senderPhone);
      fd.append("screenshot", screenshot);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE ?? "https://onettbackend.onrender.com/api/v1"}/product-requests/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
          },
          body: fd,
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Submission failed");

      const requestId = json?.data?.productRequestId;
      if (requestId) setPaidRequestId(requestId);

      toast.success("Payment proof submitted! Awaiting admin confirmation.");
      setStep("submit");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit payment. Try again.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const generateDescription = async () => {
    if (!productForm.name.trim()) return toast.error("Enter a product name first.");
    setGeneratingDesc(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Write a compelling product listing description for a marketplace. Product name: "${productForm.name}"${productForm.brand ? `, Brand: "${productForm.brand}"` : ""}. Keep it 2-3 sentences, highlight key features and benefits. Be specific and persuasive. Return only the description text, no preamble.`,
          }],
        }),
      });
      const data = await response.json();
      const text = data?.content?.find((b: any) => b.type === "text")?.text || "";
      if (text) {
        setProductForm(f => ({ ...f, productDescription: text.trim() }));
        toast.success("Description generated!");
      }
    } catch {
      toast.error("AI generation failed. Try again.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, j) => j !== i));
    setImagePreviews(prev => prev.filter((_, j) => j !== i));
  };

  const handleProductSubmit = async () => {
    if (!paidRequestId) return toast.error("No verified payment found. Contact support.");
    if (!productForm.name.trim()) return toast.error("Product name is required.");
    setSubmittingProduct(true);
    try {
      const fd = new FormData();
      fd.append("product", new Blob([JSON.stringify(productForm)], { type: "application/json" }));
      images.forEach(img => fd.append("images", img));
      await userProductApi.create(paidRequestId, fd);
      setStep("done");
      toast.success("Product submitted for review!");
    } catch {
      toast.error("Submission failed. Try again.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const steps = [
    { key: "pay",    label: "Pay Fee",        icon: <Banknote size={15} /> },
    { key: "submit", label: "Submit Product", icon: <Package size={15} /> },
    { key: "done",   label: "Await Review",   icon: <Shield size={15} /> },
  ];
  const stepIdx = { pay: 0, submit: 1, done: 2 }[step];

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                  ${i < stepIdx ? "bg-orange-500 text-white shadow-sm" :
                    i === stepIdx ? "bg-orange-50 text-orange-500 ring-2 ring-orange-300" :
                    "bg-slate-50 text-slate-300"}`}>
                  {i < stepIdx ? <Check size={15} strokeWidth={2.5} /> : s.icon}
                </div>
                <p className={`text-[10px] font-bold mt-1.5 whitespace-nowrap ${i === stepIdx ? "text-orange-500" : "text-slate-300"}`}>
                  {s.label}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-300 ${i < stepIdx ? "bg-orange-400" : "bg-slate-100"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step: Pay */}
      {step === "pay" && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100 p-6 text-center">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-orange-100">
              <Banknote size={28} className="text-orange-500" />
            </div>
            <p className="text-4xl font-black text-slate-800">₵100</p>
            <p className="text-sm text-slate-500 mt-1">One-time product listing fee</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Instructions */}
            <div className="flex gap-3 p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
              <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1">How it works</p>
                <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
                  <li>Send ₵100 via MoMo to our number</li>
                  <li>Fill in your sender details below</li>
                  <li>Upload a screenshot of the transaction</li>
                  <li>Admin confirms → you can submit your product</li>
                </ol>
              </div>
            </div>

            {/* MoMo Number Banner */}
            <div className="flex items-center justify-between p-4 bg-orange-500 rounded-2xl">
              <div>
                <p className="text-[10px] font-bold text-orange-200 uppercase tracking-widest">Send MoMo To</p>
                <p className="text-xl font-black text-white tracking-wider mt-0.5">055 000 0000</p>
                <p className="text-xs text-orange-200 mt-0.5">Account: Onett Marketplace</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Phone size={20} className="text-white" />
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                  Sender Account Name
                </Label>
                <Input
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Name registered on MoMo account"
                  className="h-11 rounded-xl border-slate-200 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                  Sender Phone Number
                </Label>
                <Input
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  placeholder="e.g. 055 XXX XXXX"
                  className="h-11 rounded-xl border-slate-200 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                  Payment Screenshot
                </Label>
                {screenshotPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                    <img src={screenshotPreview} className="w-full h-36 object-cover" alt="screenshot" />
                    <button
                      onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={13} className="text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                      <p className="text-white text-[11px] font-medium">{screenshot?.name}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => screenshotRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                  >
                    <ImageIcon size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      Tap to upload <span className="text-orange-500 font-semibold">screenshot</span>
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">PNG, JPG</p>
                    <input ref={screenshotRef} type="file" accept="image/*" className="hidden" onChange={onScreenshotChange} />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handlePaymentSubmit}
              disabled={submittingPayment}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {submittingPayment ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
              {submittingPayment ? "Submitting…" : "Submit Payment Proof"}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              Refunds available within 7 days per our refund policy.
            </p>
          </div>
        </div>
      )}

      {/* Step: Submit Product */}
      {step === "submit" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
          <div className="flex gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
            <Clock size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Awaiting Admin Confirmation</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Your payment is under review. Once confirmed, you'll be notified and can submit your product.
                You can also submit product details now and they'll be reviewed after payment is confirmed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Product Name", key: "name", placeholder: "e.g. Sony WH-1000XM5", col: 1 },
              { label: "Brand", key: "brand", placeholder: "e.g. Sony", col: 1 },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
                <Input
                  value={(productForm as any)[key]}
                  onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="h-11 rounded-xl border-slate-200 text-sm"
                />
              </div>
            ))}

            <div className="col-span-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Product Description
                </Label>
                <button
                  onClick={generateDescription}
                  disabled={generatingDesc}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[11px] font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {generatingDesc ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {generatingDesc ? "Writing…" : "AI Write"}
                </button>
              </div>
              <Textarea
                value={productForm.productDescription}
                onChange={e => setProductForm(f => ({ ...f, productDescription: e.target.value }))}
                rows={4}
                placeholder="Describe your product — specs, condition, why it's great…"
                className="rounded-xl border-slate-200 text-sm resize-none focus:border-orange-300"
              />
            </div>

            {/* Images */}
            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Product Images
              </Label>
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={src} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all"
              >
                <Upload size={22} className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-sm text-slate-400">
                  Drop or <span className="text-orange-500 font-semibold">browse</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">PNG, JPG — up to 5MB each</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onImageChange} />
              </div>
            </div>
          </div>

          <button
            onClick={handleProductSubmit}
            disabled={submittingProduct}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {submittingProduct ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={16} />}
            {submittingProduct ? "Submitting…" : "Submit Product Request"}
          </button>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">You're all set!</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-[300px] mx-auto leading-relaxed">
            Your product has been submitted for review. Check <strong>My Requests</strong> tab for status updates.
          </p>
          <button
            onClick={() => { setStep("pay"); setSenderName(""); setSenderPhone(""); setScreenshot(null); setScreenshotPreview(null); setProductForm({ name: "", brand: "", productDescription: "" }); setImages([]); setImagePreviews([]); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all"
          >
            <RefreshCw size={15} /> Submit Another Product
          </button>
        </div>
      )}
    </div>
  );
};

// ─── My Requests Tab ──────────────────────────────────────────────────────────

const MyRequestsTab = () => {
  const [requests, setRequests] = useState<RequestProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userProductApi.getMyRequests(page, 10);
      setRequests(res?.content || []);
      setTotalPages(res?.totalPages || 1);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-4"><SkeletonList count={5} /></div>;

  if (!requests.length) return (
    <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <FileText size={26} className="text-slate-300" />
      </div>
      <p className="font-bold text-slate-400 text-sm">No requests yet</p>
      <p className="text-xs text-slate-300 mt-1">Your submitted product requests will appear here</p>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {requests.map((r) => {
        const p = r.payload;
        const prod = r.productResponse;
        const status: ApprovalStatus = p?.approvalStatus || "PENDING";
        return (
          <div key={p?.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-orange-100 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-orange-100">
                {prod?.images?.[0] ? (
                  <img src={prod.images[0].imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Package size={20} className="text-orange-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {prod?.name || "Awaiting product submission"}
                    </p>
                    {prod?.brand && (
                      <p className="text-xs text-slate-400 mt-0.5">{prod.brand}</p>
                    )}
                  </div>
                  <StatusPill status={status} />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  {p?.createdAt && (
                    <span className="text-[11px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {prod && (
                    <span className={`text-[11px] font-semibold ${prod.updateCount >= 3 ? "text-red-400" : "text-slate-400"}`}>
                      {prod.updateCount}/3 updates used
                    </span>
                  )}
                  {p?.amount && (
                    <span className="text-[11px] text-slate-400">₵{p.amount}</span>
                  )}
                </div>

                {/* MoMo details (if screenshot available) */}
                {p?.senderAccountName && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sent by: <span className="font-medium text-slate-600">{p.senderAccountName}</span>
                    {p.senderPhoneNumber && ` · ${p.senderPhoneNumber}`}
                  </p>
                )}

                {status === "REJECTED" && (
                  <div className="mt-2 px-2.5 py-1.5 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-[11px] text-red-600">Payment rejected — please resubmit or contact support.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold disabled:opacity-40 hover:border-orange-300 hover:text-orange-600 transition-all"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-slate-400 font-medium">{page + 1} / {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold disabled:opacity-40 hover:border-orange-300 hover:text-orange-600 transition-all"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── My Products Tab ──────────────────────────────────────────────────────────

const MyProductsTab = () => {
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApprovalStatus | "ALL">("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", brand: "", productDescription: "" });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (filter === "ALL") {
        const [p, a, r] = await Promise.allSettled([
          userProductApi.getMyProductsByStatus("PENDING", 0, 50),
          userProductApi.getMyProductsByStatus("APPROVED", 0, 50),
          userProductApi.getMyProductsByStatus("REJECTED", 0, 50),
        ]);
        const all: UserProduct[] = [];
        [p, a, r].forEach(result => {
          if (result.status === "fulfilled") all.push(...(result.value?.content || []));
        });
        setProducts(all);
      } else {
        const res = await userProductApi.getMyProductsByStatus(filter, 0, 50);
        setProducts(res?.content || []);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (p: UserProduct) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, brand: p.brand, productDescription: p.productDescription });
    setNewImages([]);
  };

  const generateDescription = async () => {
    if (!editForm.name.trim()) return toast.error("Product name is empty.");
    setGeneratingDesc(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Write a compelling product listing description for a marketplace. Product name: "${editForm.name}"${editForm.brand ? `, Brand: "${editForm.brand}"` : ""}. Keep it 2-3 sentences, highlight key features and benefits. Return only the description text.`,
          }],
        }),
      });
      const data = await response.json();
      const text = data?.content?.find((b: any) => b.type === "text")?.text || "";
      if (text) {
        setEditForm(f => ({ ...f, productDescription: text.trim() }));
        toast.success("Description improved!");
      }
    } catch {
      toast.error("AI generation failed.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleUpdate = async (productId: string) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("product", new Blob([JSON.stringify({ ...editForm, imageIdsToDelete: [] })], { type: "application/json" }));
      newImages.forEach(img => fd.append("images", img));
      await userProductApi.update(productId, fd);
      toast.success("Product updated!");
      setEditingId(null);
      load();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const filterTabs: { key: ApprovalStatus | "ALL"; label: string; count?: number }[] = [
    { key: "ALL",      label: "All" },
    { key: "PENDING",  label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-3">
      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
              filter === f.key
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-4"><SkeletonList count={5} /></div>
      ) : !products.length ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag size={26} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-400 text-sm">No products here</p>
          <p className="text-xs text-slate-300 mt-1">Products you've submitted will appear here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map(prod => (
            <div key={prod.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-orange-100 transition-all">
              {/* Product Row */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-orange-50 border border-orange-100 flex-shrink-0 flex items-center justify-center">
                  {prod.images?.[0] ? (
                    <img src={prod.images[0].imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Package size={22} className="text-orange-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{prod.name}</p>
                  <p className="text-xs text-slate-400">{prod.brand}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-4 h-1.5 rounded-full ${i < (3 - prod.updateCount) ? "bg-orange-300" : "bg-slate-100"}`} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold ${prod.updateCount >= 3 ? "text-red-400" : "text-slate-400"}`}>
                      {prod.updateCount >= 3 ? "No updates left" : `${3 - prod.updateCount} update${3 - prod.updateCount !== 1 ? "s" : ""} left`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <StatusPill status={prod.approvalStatus} />
                  {prod.updateCount < 3 && (
                    <button
                      onClick={() => editingId === prod.id ? setEditingId(null) : startEdit(prod)}
                      className="flex items-center gap-1 text-[11px] font-bold text-orange-500 hover:text-orange-700 transition-colors"
                    >
                      <Edit2 size={11} />
                      {editingId === prod.id ? "Close" : "Edit"}
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Panel */}
              {editingId === prod.id && (
                <div className="border-t border-slate-50 bg-slate-50/80 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[{ label: "Product Name", key: "name" }, { label: "Brand", key: "brand" }].map(({ label, key }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
                        <Input
                          value={(editForm as any)[key]}
                          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                          className="h-9 text-xs rounded-xl border-slate-200"
                        />
                      </div>
                    ))}
                    <div className="col-span-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</Label>
                        <button
                          onClick={generateDescription}
                          disabled={generatingDesc}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                        >
                          {generatingDesc ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {generatingDesc ? "Writing…" : "AI Improve"}
                        </button>
                      </div>
                      <Textarea
                        value={editForm.productDescription}
                        onChange={e => setEditForm(f => ({ ...f, productDescription: e.target.value }))}
                        rows={3}
                        className="text-xs rounded-xl border-slate-200 resize-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="border border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer bg-white hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
                      >
                        <p className="text-xs text-slate-400">
                          {newImages.length ? (
                            <span className="text-orange-500 font-semibold">{newImages.length} file(s) selected</span>
                          ) : (
                            <>Click to <span className="text-orange-500 font-semibold">add images</span></>
                          )}
                        </p>
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                          onChange={e => setNewImages(Array.from(e.target.files || []))} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(prod.id)}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-all"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────

const Profile = () => {
  const { user, isLoading, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pending, approved, rejected] = await Promise.allSettled([
          userProductApi.getMyProductsByStatus("PENDING", 0, 1),
          userProductApi.getMyProductsByStatus("APPROVED", 0, 1),
          userProductApi.getMyProductsByStatus("REJECTED", 0, 1),
        ]);
        const p = pending.status === "fulfilled" ? pending.value?.totalElements || 0 : 0;
        const a = approved.status === "fulfilled" ? approved.value?.totalElements || 0 : 0;
        const r = rejected.status === "fulfilled" ? rejected.value?.totalElements || 0 : 0;
        setStats({ total: p + a + r, approved: a, pending: p });
      } catch { /* silently fail */ }
    };
    if (!isLoading && user) fetchStats();
  }, [isLoading, user]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile",     label: "Profile",     icon: <User size={13} /> },
    { key: "request",     label: "Request",     icon: <Plus size={13} /> },
    { key: "my-requests", label: "Requests",    icon: <FileText size={13} /> },
    { key: "my-products", label: "Products",    icon: <ShoppingBag size={13} /> },
  ];

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-[680px] mx-auto px-4 py-8 space-y-5">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">My Account</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Welcome back, {user?.fullName?.split(" ")[0] || "there"} 👋
            </p>
          </div>
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-sm">
            <User size={18} className="text-white" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total Listings"
            value={stats.total || "—"}
            icon={<TrendingUp size={16} className="text-white" />}
            accent="bg-orange-500"
          />
          <StatCard
            label="Approved"
            value={stats.approved || "—"}
            icon={<Star size={16} className="text-white" />}
            accent="bg-emerald-500"
          />
          <StatCard
            label="Pending"
            value={stats.pending || "—"}
            icon={<Clock size={16} className="text-white" />}
            accent="bg-amber-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all duration-200 whitespace-nowrap ${
                tab === t.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "profile"     && <ProfileTab user={user} refreshProfile={refreshProfile} />}
        {tab === "request"     && <RequestProductTab />}
        {tab === "my-requests" && <MyRequestsTab />}
        {tab === "my-products" && <MyProductsTab />}

      </div>
    </div>
  );
};

export default Profile;
