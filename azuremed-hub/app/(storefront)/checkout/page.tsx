"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Truck, CreditCard, Lock, CheckCircle, User, Phone, Mail, Upload, Tag } from "lucide-react";
import { useCart } from "@/components/CartContext";
import { useLanguage } from "@/components/LanguageContext";

/** Ported from Medical_Product/src/components/CheckoutPage/CheckoutPage.jsx. */
export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, removeFromCart } = useCart();
  const { t } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState<"kpay" | "cod">("kpay");
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", city: "Yangon", address: "" });
  const [missingFields, setMissingFields] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_percent: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          setDeliveryFee(result.data.delivery_fee_ks);
          setFreeDeliveryThreshold(result.data.free_delivery_threshold_ks);
        }
      });
  }, []);

  function handleProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setProofFile(file);
    setProofPreview(file ? URL.createObjectURL(file) : null);
  }

  async function applyPromo() {
    setPromoError("");
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    const result = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoInput }),
    }).then((r) => r.json());
    setCheckingPromo(false);
    if (!result.success) {
      setPromoError(result.message ?? t("checkout.invalidPromoCode"));
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo(result.data);
  }

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const discount = appliedPromo ? Math.round((subtotal * appliedPromo.discount_percent) / 100) : 0;
  // Preview only — the real fee is always recomputed server-side in
  // /api/orders from the same store_settings row, so this can never be
  // spoofed into a free order client-side.
  const qualifiesForFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const effectiveDeliveryFee = qualifiesForFreeDelivery ? 0 : deliveryFee;
  const total = subtotal + tax + effectiveDeliveryFee - discount;
  const amountToFreeDelivery = freeDeliveryThreshold - subtotal;

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMissingFields((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleConfirmPayment() {
    setNotice(null);
    if (cartItems.length === 0) {
      setNotice({ type: "error", message: t("checkout.cartEmptyError") });
      return;
    }

    const required = ["fullName", "email", "phone", "city", "address"] as const;
    const missing = required.filter((key) => !formData[key].trim());
    if (missing.length > 0) {
      setMissingFields(Object.fromEntries(missing.map((key) => [key, true])));
      setNotice({ type: "error", message: t("checkout.fillRequiredFields") });
      return;
    }
    if (paymentMethod === "kpay" && !proofFile) {
      setNotice({ type: "error", message: t("checkout.uploadScreenshotRequired") });
      return;
    }

    const body = new FormData();
    body.append("payment_method", paymentMethod);
    body.append("shipping", JSON.stringify(formData));
    body.append("items", JSON.stringify(cartItems.map((item) => ({ product_id: item.medicineId, qty: item.quantity }))));
    if (proofFile) body.append("payment_proof", proofFile);
    if (appliedPromo) body.append("promo_code", appliedPromo.code);

    setSubmitting(true);
    const result = await fetch("/api/orders", { method: "POST", body }).then((r) => r.json());
    setSubmitting(false);

    if (!result.success) {
      setNotice({ type: "error", message: result.message ?? t("checkout.orderCouldNotBePlaced") });
      return;
    }

    router.push(`/orders?placed=${result.data.order_code}`);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 pt-32">
      <main className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">{t("checkout.heading")}</h1>
          <p className="text-slate-500">{t("checkout.subheading")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-10">
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Truck size={24} />
                </div>
                <h2 className="text-2xl font-black">{t("checkout.shippingDetails")}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label={t("checkout.fullName")} name="fullName" placeholder="Aung Kyaw" icon={<User size={18} />} onChange={handleInputChange} value={formData.fullName} hasError={missingFields.fullName} />
                <InputField label={t("checkout.emailAddress")} name="email" placeholder="aung@example.com" type="email" icon={<Mail size={18} />} onChange={handleInputChange} value={formData.email} hasError={missingFields.email} />
                <InputField label={t("checkout.phoneNumber")} name="phone" placeholder="+95 9..." type="tel" icon={<Phone size={18} />} onChange={handleInputChange} value={formData.phone} hasError={missingFields.phone} />

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">{t("checkout.city")}</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="h-14 px-4 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 font-bold border border-slate-100"
                  >
                    <option>Yangon</option>
                    <option>Mandalay</option>
                    <option>Naypyidaw</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">{t("checkout.deliveryAddress")}</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`p-5 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 w-full font-medium border ${
                      missingFields.address ? "border-red-500" : "border-slate-100"
                    }`}
                    placeholder={t("checkout.addressPlaceholder")}
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <CreditCard size={24} />
                </div>
                <h2 className="text-2xl font-black">{t("checkout.paymentMethod")}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentOption
                  title={t("checkout.kbzPay")}
                  description={t("checkout.kbzPayDesc")}
                  selected={paymentMethod === "kpay"}
                  onClick={() => setPaymentMethod("kpay")}
                  logo={<div className="bg-[#0056b3] text-white text-[10px] font-black px-2 py-1 rounded">KPAY</div>}
                />
                <PaymentOption
                  title={t("checkout.cashOnDelivery")}
                  description={t("checkout.cashOnDeliveryDesc")}
                  selected={paymentMethod === "cod"}
                  onClick={() => setPaymentMethod("cod")}
                  logo={<Truck size={22} className="text-slate-400" />}
                />
              </div>
              {paymentMethod === "kpay" && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-black text-blue-700">{t("checkout.kbzPayNumber")}</p>
                  <p className="mt-1 font-semibold">+95 9 456 789 123</p>
                  <p className="mt-3 font-black text-blue-700">{t("checkout.demoBankAccount")}</p>
                  <p className="mt-1">{t("checkout.bankDetails")}</p>

                  <label className="mt-5 flex flex-col gap-2">
                    <span className="font-black text-blue-700">{t("checkout.uploadPaymentScreenshot")}</span>
                    <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-white p-4 cursor-pointer hover:border-blue-400 transition-colors">
                      {proofPreview ? (
                        <Image src={proofPreview} alt="Payment proof preview" width={56} height={56} className="size-14 rounded-lg object-cover shrink-0" unoptimized />
                      ) : (
                        <div className="size-14 rounded-lg bg-blue-50 text-blue-400 flex items-center justify-center shrink-0">
                          <Upload size={20} />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-slate-500">
                        {proofFile ? proofFile.name : t("checkout.clickToSelectScreenshot")}
                      </span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProofChange} className="hidden" />
                    </div>
                  </label>
                  <p className="mt-2 text-xs text-slate-500">{t("checkout.adminWillConfirm")}</p>
                </div>
              )}
              {notice && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {notice.message}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 p-10 rounded-[3rem] border border-slate-100 bg-white shadow-2xl shadow-blue-900/5">
              <h3 className="text-2xl font-black mb-8">{t("checkout.orderSummary")}</h3>

              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2">
                {cartItems.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 p-6 text-center text-slate-500">{t("cart.empty")}</div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-5 group">
                      <div className="relative size-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                        {item.image_url && <Image src={item.image_url} fill sizes="64px" className="object-contain" alt={item.name} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800">{item.name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("checkout.qty")} {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} MMK</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.medicineId)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {t("checkout.remove")}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-4">
                <label className="text-xs font-black ml-1 uppercase tracking-tighter text-slate-500">{t("checkout.promoCode")}</label>
                {/* Merged into one bordered control instead of two separate
                    rounded boxes with a gap — same functionality, smaller
                    footprint. */}
                <div className="mt-1.5 flex h-8 items-center rounded-lg border border-slate-100 bg-slate-50 pr-1 focus-within:ring-2 focus-within:ring-blue-500">
                  <Tag size={12} className="ml-2.5 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder={t("checkout.enterCode")}
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={checkingPromo}
                    className="shrink-0 rounded-md bg-slate-800 px-3 py-1 text-[11px] font-bold text-white hover:bg-slate-900 disabled:opacity-50"
                  >
                    {checkingPromo ? "..." : t("checkout.apply")}
                  </button>
                </div>
                {promoError && <p className="mt-2 text-xs font-semibold text-red-600">{promoError}</p>}
                {appliedPromo && (
                  <p className="mt-2 text-xs font-semibold text-emerald-600">
                    {t("checkout.promoApplied")
                      .replace("{code}", appliedPromo.code)
                      .replace("{percent}", String(appliedPromo.discount_percent))}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-50">
                <SummaryRow label={t("cart.subtotal")} value={`${subtotal.toLocaleString()} MMK`} />
                <SummaryRow
                  label={t("checkout.deliveryFee")}
                  value={effectiveDeliveryFee > 0 ? `${effectiveDeliveryFee.toLocaleString()} MMK` : t("checkout.free")}
                  isFree={effectiveDeliveryFee === 0}
                />
                {deliveryFee > 0 && !qualifiesForFreeDelivery && freeDeliveryThreshold > 0 && cartItems.length > 0 && (
                  <p className="-mt-2 text-xs font-semibold text-blue-600">
                    {t("checkout.addMoreForFreeDelivery").replace("{amount}", amountToFreeDelivery.toLocaleString())}
                  </p>
                )}
                <SummaryRow label={t("checkout.governmentTax")} value={`${tax.toLocaleString()} MMK`} />
                {discount > 0 && <SummaryRow label={t("checkout.promoDiscount")} value={`-${discount.toLocaleString()} MMK`} isFree />}
                <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-4">
                  <span className="text-lg font-black text-slate-400 uppercase tracking-tighter">{t("checkout.totalAmount")}</span>
                  <span className="text-4xl font-black text-blue-600">
                    {total.toLocaleString()} <span className="text-sm">MMK</span>
                  </span>
                </div>
              </div>

              <div className="mt-10 flex flex-col items-center gap-6">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-200 transition-all disabled:opacity-50"
                >
                  {submitting ? t("checkout.placingOrder") : paymentMethod === "kpay" ? t("checkout.confirmKpay") : t("checkout.confirmCod")}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 mt-8 text-slate-300">
                <Lock size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t("checkout.secureConnection")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputField({
  label,
  name,
  placeholder,
  type = "text",
  icon,
  onChange,
  value,
  hasError,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  hasError?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">{label}</label>
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full h-14 pl-14 pr-4 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 font-medium border ${
            hasError ? "border-red-500" : "border-slate-100"
          }`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function PaymentOption({
  title,
  description,
  selected,
  onClick,
  logo,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  logo: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${
        selected ? "border-blue-500 bg-blue-50/30 ring-4 ring-blue-50" : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-50">{logo}</div>
        {selected && <CheckCircle className="text-blue-600" size={24} />}
      </div>
      <p className="font-black text-slate-900">{title}</p>
      <p className="text-xs font-bold text-slate-400 mt-1">{description}</p>
    </div>
  );
}

function SummaryRow({ label, value, isFree }: { label: string; value: string; isFree?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="font-bold text-slate-400">{label}</span>
      <span className={isFree ? "text-emerald-500 font-black tracking-widest" : "font-black text-slate-700"}>{value}</span>
    </div>
  );
}
