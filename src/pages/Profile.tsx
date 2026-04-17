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

type ProfileTab = "profile" | "request" | "my-requests" | "my-products";
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type PaymentStep = "pay" | "submit" | "done";

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

const STATUS_PILL_CONFIG: Record<ApprovalStatus, { label: string; icon: React.ReactNode; bg: string; text: string; dot: string }> = {
  PENDING:  { label: "Pending",  icon: <Clock size={10} />,        bg: "bg-orange-50",  text: "text-orange-600",  dot: "bg-orange-400" },
  APPROVED: { label: "Approved", icon: <CheckCircle size={10} />,  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  REJECTED: { label: "Rejected", icon: <XCircle size={10} />,      bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400" },
};

const ApprovalStatusPill = ({ status }: { status: ApprovalStatus }) => {
  const c = STATUS_PILL_CONFIG[status];
  return (
    <span className={`approval-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`approval-pill__dot w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const ProfileStatCard = ({
  label, value, icon, accentBg
}: {
  label: string; value: string | number; icon: React.ReactNode; accentBg: string;
}) => (
  <div className="profile-stat-card relative bg-white rounded-2xl border border-orange-100 p-4 overflow-hidden group hover:border-orange-300 hover:shadow-sm transition-all duration-200">
    <div className={`profile-stat-card__bg absolute top-0 right-0 w-16 h-16 rounded-bl-[40px] ${accentBg} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
    <div className={`profile-stat-card__icon-wrap w-9 h-9 rounded-xl ${accentBg} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="profile-stat-card__value text-2xl font-black text-gray-800 leading-none">{value}</p>
    <p className="profile-stat-card__label text-[11px] text-gray-400 font-medium mt-1">{label}</p>
  </div>
);

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const ProfileInfoTab = ({ user, refreshProfile }: { user: any; refreshProfile: () => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        location: user.location || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(profileForm)], { type: "application/json" }));
      if (picFile) fd.append("profilePic", picFile);
      await userApi.updateProfile(fd);
      await refreshProfile();
      setIsEditing(false);
      setPicPreview(null);
      setPicFile(null);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onPicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setPicFile(f);
    if (f) setPicPreview(URL.createObjectURL(f));
  };

  const userInitials = user?.fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <div className="profile-info-tab space-y-4">
      {/* Header Card */}
      <div className="profile-header-card bg-white rounded-3xl border border-orange-100 overflow-hidden">
        <div className="profile-header-card__cover h-28 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 relative">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)`
          }} />
        </div>

        <div className="profile-header-card__body px-6 pb-6">
          <div className="profile-header-card__avatar-row flex items-end justify-between -mt-10 mb-5">
            {/* Avatar */}
            <div className="profile-avatar relative">
              <div className="profile-avatar__img-wrap w-20 h-20 rounded-2xl border-4 border-white bg-orange-50 flex items-center justify-center shadow-lg overflow-hidden">
                {picPreview ? (
                  <img src={picPreview} className="w-full h-full object-cover" alt="preview" />
                ) : user?.profilePic?.imageUrl ? (
                  <img src={user.profilePic.imageUrl} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <span className="profile-avatar__initials text-2xl font-black text-orange-500">{userInitials}</span>
                )}
              </div>
              {isEditing && (
                <label className="profile-avatar__upload-btn absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-sm">
                  <Camera size={12} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={onPicChange} />
                </label>
              )}
            </div>

            {/* Edit actions */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="profile-edit-btn flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-200 text-orange-600 text-xs font-semibold hover:border-orange-400 hover:bg-orange-50 transition-all"
              >
                <Edit2 size={13} /> Edit Profile
              </button>
            ) : (
              <div className="profile-edit-actions flex gap-2">
                <button
                  onClick={() => { setIsEditing(false); setPicPreview(null); setPicFile(null); }}
                  className="profile-edit-actions__cancel flex items-center gap-1 px-3 py-2 rounded-xl border border-orange-200 text-orange-400 text-xs font-medium hover:bg-orange-50 transition-all"
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="profile-edit-actions__save flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-60 transition-all shadow-sm"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="profile-view">
              <div className="profile-view__name-row flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-gray-800">{user?.fullName}</h2>
                {user?.approvalStatus === "APPROVED" && (
                  <span className="profile-view__verified-badge w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="profile-view__bio text-sm text-gray-400 mb-5 leading-relaxed">
                {user?.bio || <em className="text-gray-300">No bio added yet</em>}
              </p>
              <div className="profile-view__contact-list grid grid-cols-1 gap-2.5">
                {[
                  { icon: <Mail size={14} className="text-orange-500" />, val: user?.email, label: "Email" },
                  { icon: <Phone size={14} className="text-orange-500" />, val: user?.phoneNumber || "Not set", label: "Phone" },
                  { icon: <MapPin size={14} className="text-orange-500" />, val: user?.location || "Not set", label: "Location" },
                ].map((f, i) => (
                  <div key={i} className="profile-contact-row flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-100">
                    <div className="profile-contact-row__icon-wrap w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-orange-100">
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">{f.label}</p>
                      <p className="text-sm text-gray-600 font-medium">{f.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="profile-edit-form grid grid-cols-2 gap-3">
              {[
                { label: "Full Name", key: "fullName", placeholder: "Your full name" },
                { label: "Phone Number", key: "phoneNumber", placeholder: "+233 XX XXX XXXX" },
                { label: "Location", key: "location", placeholder: "City, Country" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</Label>
                  <Input
                    value={(profileForm as any)[key]}
                    onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="h-10 text-sm rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                  />
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bio</Label>
                <Textarea
                  value={profileForm.bio}
                  onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell the world about yourself..."
                  className="text-sm rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-100 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="profile-account-info bg-white rounded-3xl border border-orange-100 p-5">
        <h3 className="profile-account-info__heading text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Account Info</h3>
        <div className="space-y-3">
          {[
            { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—" },
            { label: "Account Type", value: "Buyer / Requester" },
            { label: "Email Verified", value: user?.emailVerified ? "Verified ✓" : "Not verified" },
          ].map((row, i) => (
            <div key={i} className="profile-account-row flex items-center justify-between py-2 border-b border-orange-50 last:border-0">
              <span className="text-sm text-gray-400">{row.label}</span>
              <span className="text-sm font-semibold text-gray-700">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Request Product Tab ──────────────────────────────────────────────────────

const RequestProductTab = () => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("pay");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [paidRequestId, setPaidRequestId] = useState<string | null>(null);

  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payScreenshot, setPayScreenshot] = useState<File | null>(null);
  const [payScreenshotPreview, setPayScreenshotPreview] = useState<string | null>(null);
  const payScreenshotRef = useRef<HTMLInputElement>(null);

  const [productForm, setProductForm] = useState({ name: "", brand: "", productDescription: "" });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const productFileRef = useRef<HTMLInputElement>(null);

  const [generatingDesc, setGeneratingDesc] = useState(false);

  const onPayScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setPayScreenshot(f);
    if (f) setPayScreenshotPreview(URL.createObjectURL(f));
  };

  const submitPaymentProof = async () => {
    if (!payerName.trim()) return toast.error("Sender name is required.");
    if (!payerPhone.trim()) return toast.error("Sender phone number is required.");
    if (!payScreenshot) return toast.error("Payment screenshot is required.");

    setSubmittingPayment(true);
    try {
      const fd = new FormData();
      fd.append("senderAccountName", payerName);
      fd.append("senderPhoneNumber", payerPhone);
      fd.append("screenshot", payScreenshot);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE ?? "https://onettbackend.onrender.com/api/v1"}/product-requests/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}` },
          body: fd,
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Submission failed");

      const requestId = json?.data?.productRequestId;
      if (requestId) setPaidRequestId(requestId);

      toast.success("Payment proof submitted! Awaiting admin confirmation.");
      setCurrentStep("submit");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit payment. Try again.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const generateAIDescription = async () => {
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

  const onProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductImages(prev => [...prev, ...files]);
    setProductImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeProductImage = (i: number) => {
    setProductImages(prev => prev.filter((_, j) => j !== i));
    setProductImagePreviews(prev => prev.filter((_, j) => j !== i));
  };

  const submitProduct = async () => {
    if (!paidRequestId) return toast.error("No verified payment found. Contact support.");
    if (!productForm.name.trim()) return toast.error("Product name is required.");
    setSubmittingProduct(true);
    try {
      const fd = new FormData();
      fd.append("product", new Blob([JSON.stringify(productForm)], { type: "application/json" }));
      productImages.forEach(img => fd.append("images", img));
      await userProductApi.create(paidRequestId, fd);
      setCurrentStep("done");
      toast.success("Product submitted for review!");
    } catch {
      toast.error("Submission failed. Try again.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const stepDefs = [
    { key: "pay",    label: "Pay Fee",        icon: <Banknote size={15} /> },
    { key: "submit", label: "Submit Product", icon: <Package size={15} /> },
    { key: "done",   label: "Await Review",   icon: <Shield size={15} /> },
  ];
  const stepIdx = { pay: 0, submit: 1, done: 2 }[currentStep];

  return (
    <div className="request-tab space-y-4">
      {/* Stepper */}
      <div className="request-stepper bg-white rounded-3xl border border-orange-100 p-5">
        <div className="request-stepper__track flex items-center">
          {stepDefs.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`request-stepper__step w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                  ${i < stepIdx ? "bg-orange-500 text-white shadow-sm" :
                    i === stepIdx ? "bg-orange-50 text-orange-500 ring-2 ring-orange-300" :
                    "bg-gray-50 text-gray-300"}`}>
                  {i < stepIdx ? <Check size={15} strokeWidth={2.5} /> : s.icon}
                </div>
                <p className={`request-stepper__label text-[10px] font-bold mt-1.5 whitespace-nowrap ${i === stepIdx ? "text-orange-500" : "text-gray-300"}`}>
                  {s.label}
                </p>
              </div>
              {i < stepDefs.length - 1 && (
                <div className={`request-stepper__connector flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-300 ${i < stepIdx ? "bg-orange-400" : "bg-gray-100"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step: Pay */}
      {currentStep === "pay" && (
        <div className="request-pay-step bg-white rounded-3xl border border-orange-100 overflow-hidden">
          {/* Hero */}
          <div className="request-pay-step__hero bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100 p-6 text-center">
            <div className="request-pay-step__fee-icon w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-orange-100">
              <Banknote size={28} className="text-orange-500" />
            </div>
            <p className="request-pay-step__amount text-4xl font-black text-gray-800">₵100</p>
            <p className="text-sm text-gray-500 mt-1">One-time product listing fee</p>
          </div>

          <div className="request-pay-step__body p-5 space-y-4">
            {/* Instructions */}
            <div className="request-pay-step__how-it-works flex gap-3 p-3.5 bg-orange-50 rounded-2xl border border-orange-100">
              <Info size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-orange-700 mb-1">How it works</p>
                <ol className="text-xs text-orange-600 space-y-0.5 list-decimal list-inside">
                  <li>Send ₵100 via MoMo to our number</li>
                  <li>Fill in your sender details below</li>
                  <li>Upload a screenshot of the transaction</li>
                  <li>Admin confirms → you can submit your product</li>
                </ol>
              </div>
            </div>

            {/* MoMo number */}
            <div className="request-momo-banner flex items-center justify-between p-4 bg-orange-500 rounded-2xl">
              <div>
                <p className="text-[10px] font-bold text-orange-200 uppercase tracking-widest">Send MoMo To</p>
                <p className="request-momo-banner__number text-xl font-black text-white tracking-wider mt-0.5">0257765011</p>
                <p className="text-xs text-orange-200 mt-0.5">Account: Onett Marketplace</p>
              </div>
              <div className="request-momo-banner__icon-wrap w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Phone size={20} className="text-white" />
              </div>
            </div>

            {/* Form */}
            <div className="request-pay-step__form space-y-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Sender Account Name
                </Label>
                <Input
                  value={payerName}
                  onChange={e => setPayerName(e.target.value)}
                  placeholder="Name registered on MoMo account"
                  className="h-11 rounded-xl border-orange-200 text-sm focus:border-orange-400"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Sender Phone Number
                </Label>
                <Input
                  value={payerPhone}
                  onChange={e => setPayerPhone(e.target.value)}
                  placeholder="e.g. 025 XXX XXXX"
                  className="h-11 rounded-xl border-orange-200 text-sm focus:border-orange-400"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Payment Screenshot
                </Label>
                {payScreenshotPreview ? (
                  <div className="request-screenshot-preview relative rounded-2xl overflow-hidden border border-orange-200">
                    <img src={payScreenshotPreview} className="w-full h-36 object-cover" alt="screenshot" />
                    <button
                      onClick={() => { setPayScreenshot(null); setPayScreenshotPreview(null); }}
                      className="request-screenshot-preview__clear absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                    >
                      <X size={13} className="text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                      <p className="text-white text-[11px] font-medium">{payScreenshot?.name}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => payScreenshotRef.current?.click()}
                    className="request-screenshot-upload border-2 border-dashed border-orange-200 rounded-2xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
                  >
                    <ImageIcon size={24} className="text-orange-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Tap to upload <span className="text-orange-500 font-semibold">screenshot</span>
                    </p>
                    <p className="text-[11px] text-gray-300 mt-1">PNG, JPG</p>
                    <input ref={payScreenshotRef} type="file" accept="image/*" className="hidden" onChange={onPayScreenshotChange} />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={submitPaymentProof}
              disabled={submittingPayment}
              className="request-pay-step__submit-btn w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {submittingPayment ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
              {submittingPayment ? "Submitting…" : "Submit Payment Proof"}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              Refunds available within 7 days per our refund policy.
            </p>
          </div>
        </div>
      )}

      {/* Step: Submit Product */}
      {currentStep === "submit" && (
        <div className="request-submit-step bg-white rounded-3xl border border-orange-100 p-5 space-y-4">
          <div className="request-submit-step__notice flex gap-3 p-3.5 bg-orange-50 rounded-2xl border border-orange-100">
            <Clock size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-orange-700">Awaiting Admin Confirmation</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Your payment is under review. Once confirmed, you'll be notified and can submit your product.
                You can also submit product details now and they'll be reviewed after payment is confirmed.
              </p>
            </div>
          </div>

          <div className="request-product-form grid grid-cols-2 gap-3">
            {[
              { label: "Product Name", key: "name", placeholder: "e.g. Sony WH-1000XM5" },
              { label: "Brand", key: "brand", placeholder: "e.g. Sony" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</Label>
                <Input
                  value={(productForm as any)[key]}
                  onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="h-11 rounded-xl border-orange-200 text-sm"
                />
              </div>
            ))}

            <div className="col-span-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Product Description
                </Label>
                <button
                  onClick={generateAIDescription}
                  disabled={generatingDesc}
                  className="request-ai-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold hover:opacity-90 disabled:opacity-60 transition-all"
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
                className="rounded-xl border-orange-200 text-sm resize-none focus:border-orange-400"
              />
            </div>

            {/* Images */}
            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                Product Images
              </Label>
              {productImagePreviews.length > 0 && (
                <div className="request-product-form__image-grid flex gap-2 flex-wrap">
                  {productImagePreviews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-orange-200 group">
                      <img src={src} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => removeProductImage(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                onClick={() => productFileRef.current?.click()}
                className="request-image-upload border-2 border-dashed border-orange-200 rounded-2xl p-5 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
              >
                <Upload size={22} className="text-orange-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-400">
                  Drop or <span className="text-orange-500 font-semibold">browse</span>
                </p>
                <p className="text-[11px] text-gray-300 mt-0.5">PNG, JPG — up to 5MB each</p>
                <input ref={productFileRef} type="file" accept="image/*" multiple className="hidden" onChange={onProductImageChange} />
              </div>
            </div>
          </div>

          <button
            onClick={submitProduct}
            disabled={submittingProduct}
            className="request-submit-step__btn w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {submittingProduct ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={16} />}
            {submittingProduct ? "Submitting…" : "Submit Product Request"}
          </button>
        </div>
      )}

      {/* Step: Done */}
      {currentStep === "done" && (
        <div className="request-done-step bg-white rounded-3xl border border-orange-100 p-10 text-center">
          <div className="request-done-step__icon w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-800 mb-2">You're all set!</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-[300px] mx-auto leading-relaxed">
            Your product has been submitted for review. Check <strong>My Requests</strong> tab for status updates.
          </p>
          <button
            onClick={() => {
              setCurrentStep("pay");
              setPayerName(""); setPayerPhone(""); setPayScreenshot(null); setPayScreenshotPreview(null);
              setProductForm({ name: "", brand: "", productDescription: "" });
              setProductImages([]); setProductImagePreviews([]);
            }}
            className="request-done-step__restart inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-orange-200 text-orange-600 text-sm font-semibold hover:border-orange-400 hover:bg-orange-50 transition-all"
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
  const [requestList, setRequestList] = useState<RequestProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userProductApi.getMyRequests(currentPage, 10);
      setRequestList(res?.content || []);
      setTotalPages(res?.totalPages || 1);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  if (loading) return <div className="py-4"><SkeletonList count={5} /></div>;

  if (!requestList.length) return (
    <div className="my-requests-empty bg-white rounded-3xl border border-orange-100 p-16 text-center">
      <div className="my-requests-empty__icon w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <FileText size={26} className="text-orange-300" />
      </div>
      <p className="font-bold text-gray-400 text-sm">No requests yet</p>
      <p className="text-xs text-gray-300 mt-1">Your submitted product requests will appear here</p>
    </div>
  );

  return (
    <div className="my-requests-list space-y-2.5">
      {requestList.map((r) => {
        const payload = r.payload;
        const product = r.productResponse;
        const status: ApprovalStatus = payload?.approvalStatus || "PENDING";
        return (
          <div key={payload?.id} className="my-requests-list__item bg-white rounded-2xl border border-orange-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <div className="my-requests-list__thumb w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-orange-100">
                {product?.images?.[0] ? (
                  <img src={product.images[0].imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Package size={20} className="text-orange-300" />
                )}
              </div>

              <div className="my-requests-list__details flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-gray-800 truncate">
                      {product?.name || "Awaiting product submission"}
                    </p>
                    {product?.brand && (
                      <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
                    )}
                  </div>
                  <ApprovalStatusPill status={status} />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  {payload?.createdAt && (
                    <span className="text-[11px] text-gray-400">
                      {new Date(payload.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {product && (
                    <span className={`text-[11px] font-semibold ${product.updateCount >= 3 ? "text-red-400" : "text-gray-400"}`}>
                      {product.updateCount}/3 updates used
                    </span>
                  )}
                  {payload?.amount && (
                    <span className="text-[11px] text-gray-400">₵{payload.amount}</span>
                  )}
                </div>

                {payload?.senderAccountName && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Sent by: <span className="font-medium text-gray-600">{payload.senderAccountName}</span>
                    {payload.senderPhoneNumber && ` · ${payload.senderPhoneNumber}`}
                  </p>
                )}

                {status === "REJECTED" && (
                  <div className="my-requests-list__rejection-note mt-2 px-2.5 py-1.5 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-[11px] text-orange-700">Payment rejected — please resubmit or contact support.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="my-requests-list__pagination flex items-center justify-center gap-3 pt-2">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-orange-200 text-orange-600 text-xs font-semibold disabled:opacity-40 hover:border-orange-400 hover:bg-orange-50 transition-all"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-gray-400 font-medium">{currentPage + 1} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(p => p + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-orange-200 text-orange-600 text-xs font-semibold disabled:opacity-40 hover:border-orange-400 hover:bg-orange-50 transition-all"
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
  const [productList, setProductList] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "ALL">("ALL");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", brand: "", productDescription: "" });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (statusFilter === "ALL") {
        const [p, a, r] = await Promise.allSettled([
          userProductApi.getMyProductsByStatus("PENDING", 0, 50),
          userProductApi.getMyProductsByStatus("APPROVED", 0, 50),
          userProductApi.getMyProductsByStatus("REJECTED", 0, 50),
        ]);
        const all: UserProduct[] = [];
        [p, a, r].forEach(result => {
          if (result.status === "fulfilled") all.push(...(result.value?.content || []));
        });
        setProductList(all);
      } else {
        const res = await userProductApi.getMyProductsByStatus(statusFilter, 0, 50);
        setProductList(res?.content || []);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const beginEdit = (p: UserProduct) => {
    setEditingProductId(p.id);
    setEditForm({ name: p.name, brand: p.brand, productDescription: p.productDescription });
    setNewImages([]);
  };

  const improveWithAI = async () => {
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

  const saveProductEdit = async (productId: string) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("product", new Blob([JSON.stringify({ ...editForm, imageIdsToDelete: [] })], { type: "application/json" }));
      newImages.forEach(img => fd.append("images", img));
      await userProductApi.update(productId, fd);
      toast.success("Product updated!");
      setEditingProductId(null);
      loadProducts();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const statusFilters: { key: ApprovalStatus | "ALL"; label: string }[] = [
    { key: "ALL",      label: "All" },
    { key: "PENDING",  label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="my-products-tab space-y-3">
      {/* Filter pills */}
      <div className="my-products-tab__filters flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`my-products-tab__filter-pill flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
              statusFilter === f.key
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-white text-orange-500 border border-orange-200 hover:border-orange-400 hover:bg-orange-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-4"><SkeletonList count={5} /></div>
      ) : !productList.length ? (
        <div className="my-products-empty bg-white rounded-3xl border border-orange-100 p-16 text-center">
          <div className="my-products-empty__icon w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag size={26} className="text-orange-300" />
          </div>
          <p className="font-bold text-gray-400 text-sm">No products here</p>
          <p className="text-xs text-gray-300 mt-1">Products you've submitted will appear here</p>
        </div>
      ) : (
        <div className="my-products-list space-y-2.5">
          {productList.map(prod => (
            <div key={prod.id} className="my-products-list__item bg-white rounded-2xl border border-orange-100 overflow-hidden hover:border-orange-200 transition-all">
              <div className="my-products-list__item-row p-4 flex items-center gap-3">
                <div className="my-products-list__thumb w-14 h-14 rounded-xl overflow-hidden bg-orange-50 border border-orange-100 flex-shrink-0 flex items-center justify-center">
                  {prod.images?.[0] ? (
                    <img src={prod.images[0].imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Package size={22} className="text-orange-300" />
                  )}
                </div>

                <div className="my-products-list__item-info flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{prod.name}</p>
                  <p className="text-xs text-gray-400">{prod.brand}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-4 h-1.5 rounded-full ${i < (3 - prod.updateCount) ? "bg-orange-300" : "bg-gray-100"}`} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold ${prod.updateCount >= 3 ? "text-red-400" : "text-gray-400"}`}>
                      {prod.updateCount >= 3 ? "No updates left" : `${3 - prod.updateCount} update${3 - prod.updateCount !== 1 ? "s" : ""} left`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <ApprovalStatusPill status={prod.approvalStatus} />
                  {prod.updateCount < 3 && (
                    <button
                      onClick={() => editingProductId === prod.id ? setEditingProductId(null) : beginEdit(prod)}
                      className="my-products-list__edit-btn flex items-center gap-1 text-[11px] font-bold text-orange-500 hover:text-orange-700 transition-colors"
                    >
                      <Edit2 size={11} />
                      {editingProductId === prod.id ? "Close" : "Edit"}
                    </button>
                  )}
                </div>
              </div>

              {/* Edit panel */}
              {editingProductId === prod.id && (
                <div className="my-products-edit-panel border-t border-orange-50 bg-orange-50/50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[{ label: "Product Name", key: "name" }, { label: "Brand", key: "brand" }].map(({ label, key }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</Label>
                        <Input
                          value={(editForm as any)[key]}
                          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                          className="h-9 text-xs rounded-xl border-orange-200"
                        />
                      </div>
                    ))}
                    <div className="col-span-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</Label>
                        <button
                          onClick={improveWithAI}
                          disabled={generatingDesc}
                          className="my-products-edit-panel__ai-btn flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                        >
                          {generatingDesc ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {generatingDesc ? "Writing…" : "AI Improve"}
                        </button>
                      </div>
                      <Textarea
                        value={editForm.productDescription}
                        onChange={e => setEditForm(f => ({ ...f, productDescription: e.target.value }))}
                        rows={3}
                        className="text-xs rounded-xl border-orange-200 resize-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <div
                        onClick={() => editFileRef.current?.click()}
                        className="my-products-edit-panel__img-upload border border-dashed border-orange-200 rounded-xl p-3 text-center cursor-pointer bg-white hover:border-orange-400 hover:bg-orange-50 transition-colors"
                      >
                        <p className="text-xs text-gray-400">
                          {newImages.length ? (
                            <span className="text-orange-500 font-semibold">{newImages.length} file(s) selected</span>
                          ) : (
                            <>Click to <span className="text-orange-500 font-semibold">add images</span></>
                          )}
                        </p>
                        <input
                          ref={editFileRef}
                          type="file" accept="image/*" multiple className="hidden"
                          onChange={e => setNewImages(Array.from(e.target.files || []))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="my-products-edit-panel__actions flex gap-2">
                    <button
                      onClick={() => saveProductEdit(prod.id)}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-all"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setEditingProductId(null)}
                      className="px-4 py-2 border border-orange-200 text-orange-500 text-xs font-semibold rounded-xl hover:bg-orange-50 transition-all"
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

const ProfilePage = () => {
  const { user, isLoading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [userStats, setUserStats] = useState({ total: 0, approved: 0, pending: 0 });

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
        setUserStats({ total: p + a + r, approved: a, pending: p });
      } catch { /* silently fail */ }
    };
    if (!isLoading && user) fetchStats();
  }, [isLoading, user]);

  const tabDefs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: "profile",     label: "Profile",  icon: <User size={13} /> },
    { key: "request",     label: "Request",  icon: <Plus size={13} /> },
    { key: "my-requests", label: "Requests", icon: <FileText size={13} /> },
    { key: "my-products", label: "Products", icon: <ShoppingBag size={13} /> },
  ];

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="profile-page min-h-screen bg-orange-50/30">
      <Navbar />

      <div className="profile-page__container max-w-[680px] mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="profile-page__header flex items-center justify-between">
          <div>
            <h1 className="profile-page__title text-2xl font-black text-gray-800">My Account</h1>
            <p className="profile-page__subtitle text-sm text-gray-400 mt-0.5">
              Welcome back, {user?.fullName?.split(" ")[0] || "there"} 👋
            </p>
          </div>
          <div className="profile-page__header-icon w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-sm">
            <User size={18} className="text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-row grid grid-cols-3 gap-3">
          <ProfileStatCard
            label="Total Listings"
            value={userStats.total || "—"}
            icon={<TrendingUp size={16} className="text-white" />}
            accentBg="bg-orange-500"
          />
          <ProfileStatCard
            label="Approved"
            value={userStats.approved || "—"}
            icon={<Star size={16} className="text-white" />}
            accentBg="bg-emerald-500"
          />
          <ProfileStatCard
            label="Pending"
            value={userStats.pending || "—"}
            icon={<Clock size={16} className="text-white" />}
            accentBg="bg-amber-500"
          />
        </div>

        {/* Tab Nav */}
        <div className="profile-tab-nav bg-white rounded-2xl border border-orange-100 p-1.5 flex gap-1">
          {tabDefs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`profile-tab-nav__btn flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-orange-400 hover:text-orange-600 hover:bg-orange-50"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "profile"     && <ProfileInfoTab user={user} refreshProfile={refreshProfile} />}
        {activeTab === "request"     && <RequestProductTab />}
        {activeTab === "my-requests" && <MyRequestsTab />}
        {activeTab === "my-products" && <MyProductsTab />}

      </div>
    </div>
  );
};

export default ProfilePage;
