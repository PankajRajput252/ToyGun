import { useState, useEffect, useRef } from "react";
import { subscriptionIncomeTypeApi } from "../services/api"; // ← adjust path to your actual api.ts

// ─── CONFIG ─────────────────────────────────────────────────────────────────────
const SUBSCRIPTION_CODE = "PREMIUM_MEMBERSHIP_CHARGE";
const RAZORPAY_KEY = "rzp_test_Sk36cjHZNLcY5o"; // ← your key
// ─────────────────────────────────────────────────────────────────────────────────

interface SubscriptionType {
  subscriptionDefinitionPkId: number;
  subscriptionName: string;
  subscriptionCode: string;
  subscriptionAmount: number;
}

const FEATURES = [
  { icon: "⚡", title: "Unlimited access", desc: "No caps, no throttling, ever" },
  { icon: "🎯", title: "Priority support", desc: "Response within 2 hours guaranteed" },
  { icon: "📊", title: "Advanced analytics", desc: "Full dashboard with insights & reports" },
  { icon: "🚀", title: "Early feature access", desc: "Try new features before anyone else" },
  { icon: "🛡️", title: "Enhanced security", desc: "2FA, audit logs & data encryption" },
  { icon: "🔄", title: "Cancel anytime", desc: "No lock-in, no hidden fees" },
];

const TESTIMONIALS = [
  { name: "Arjun Sharma", role: "Founder, TechVentures", text: "Worth every rupee. The ROI was immediate.", avatar: "AS" },
  { name: "Priya Nair", role: "Product Lead, Growfast", text: "Premium support alone saved us 10+ hours a month.", avatar: "PN" },
  { name: "Rahul Dev", role: "CTO, Buildspace", text: "Switching to yearly was the best decision we made.", avatar: "RD" },
];

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // ─── Subscription / pricing state ────────────────────────────────────────────
  const [subscriptionDef, setSubscriptionDef] = useState<SubscriptionType | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const heroRef = useRef(null);

  // ─── Fetch PREMIUM_AMOUNT subscription on mount ──────────────────────────────
  useEffect(() => {
    const fetchPremiumPrice = async () => {
      try {
        setIsFetchingPrice(true);
        setFetchError("");

        const response = await subscriptionIncomeTypeApi.getAll(0, 25, "ACTIVE");
        console.log("Subscription definitions:", response);

        // Find the one matching PREMIUM_AMOUNT code
        const premiumSub = response.content.find(
          (item: any) => item.subscriptionName === SUBSCRIPTION_CODE
        );

        if (premiumSub) {
          setSubscriptionDef(premiumSub);
        } else {
          setFetchError(`No subscription found with code "${SUBSCRIPTION_CODE}"`);
        }
      } catch (err) {
        console.error("Failed to fetch premium subscription price:", err);
        setFetchError("Failed to load pricing. Please refresh the page.");
      } finally {
        setIsFetchingPrice(false);
      }
    };

    fetchPremiumPrice();
  }, []);

  // auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // ─── Derived pricing ──────────────────────────────────────────────────────────
  const basePrice = subscriptionDef?.subscriptionAmount || 0;
  const gst = +(basePrice * 0.18).toFixed(2);
  const total = +(basePrice + gst).toFixed(2);

  const getUser = () => JSON.parse(localStorage.getItem("stylocoin_user") || "{}");

  // ─── Purchase flow — same pattern as CartPage ────────────────────────────────
  const handlePurchase = async () => {
    setError("");

    if (!subscriptionDef || basePrice <= 0) {
      setError("Premium pricing not available right now. Please try again later.");
      return;
    }

    setLoading(true);
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) throw new Error("Could not load Razorpay. Check your connection.");

      const user = getUser();
      const buyerName  = user?.name || user?.fullName || "";
      const buyerEmail = user?.email || "";
      const buyerPhone = user?.phone || user?.mobile || "";

      // ── STEP 1: Create order on backend ────────────────────────────────────
      // ── When your backend order-create API is ready, replace this block ───
      // const orderRes = await fetch(`${API_URL}/api/payments/orders`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     subscriptionId: subscriptionDef.subscriptionDefinitionPkId,
      //     amount: total,
      //     currency: "INR",
      //     notes: `Premium membership - ${subscriptionDef.subscriptionName}`,
      //   }),
      // });
      // const order = await orderRes.json();
      // const razorpayOrderId = order.razorpayOrderId;
      // ────────────────────────────────────────────────────────────────────────

      // TEMPORARY: until backend order-create API is ready
      const razorpayOrderId: string | null = null;
      const localOrderId = `PREM-${Date.now()}`;

      // ── STEP 2: Open Razorpay checkout ──────────────────────────────────────
      const options = {
        key: RAZORPAY_KEY,
        amount: Math.round(total * 100), // paise
        currency: "INR",
        name: "Bandookwale Premium",
        description: subscriptionDef.subscriptionName || "Premium Membership",
        order_id: razorpayOrderId, // null until backend ready
        prefill: { name: buyerName, email: buyerEmail, contact: buyerPhone },
        notes: {
          subscriptionCode: subscriptionDef.subscriptionCode,
          subscriptionId:   subscriptionDef.subscriptionDefinitionPkId,
        },
        theme: { color: "#B45309" },

        // ── PAYMENT SUCCESS ────────────────────────────────────────────────────
        handler: async (razorpayResponse: any) => {
          console.log("Premium payment success:", razorpayResponse);

          // ── STEP 3: Verify payment on backend ──────────────────────────────
          // ── When your backend verify API is ready, replace this block ─────
          // const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
          //   method: "POST",
          //   headers: {
          //     "Content-Type": "application/json",
          //     Authorization: `Bearer ${localStorage.getItem("token")}`,
          //   },
          //   body: JSON.stringify({
          //     razorpayOrderId: razorpayResponse.razorpay_order_id,
          //     razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          //     razorpaySignature: razorpayResponse.razorpay_signature,
          //     subscriptionId: subscriptionDef.subscriptionDefinitionPkId,
          //   }),
          // });
          // const result = await verifyRes.json();
          // ────────────────────────────────────────────────────────────────────

          setSuccess({
            paymentId: razorpayResponse.razorpay_payment_id,
            plan: subscriptionDef.subscriptionName,
            amount: total,
          });
          setLoading(false);
        },

        // ── MODAL DISMISSED ─────────────────────────────────────────────────────
        modal: {
          ondismiss: () => {
            console.log("Premium payment modal dismissed by user");
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      // ── PAYMENT FAILED ───────────────────────────────────────────────────────
      razorpay.on("payment.failed", (response: any) => {
        console.error("Premium payment failed:", response.error);
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      razorpay.open();

    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) return <SuccessScreen success={success} />;

  return (
    <div style={styles.page}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <div style={styles.container}>

        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>◆</span>
            <span style={styles.logoText}>Bandookwale</span>
          </div>
          <div style={styles.headerBadge}>
            <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#92400E" }}>
              🔐 Secure checkout
            </span>
          </div>
        </header>

        {/* ── Hero ── */}
        <section ref={heroRef} style={styles.hero}>
          <div style={styles.heroPill}>✦ Premium Membership</div>
          <h1 style={styles.heroTitle}>
            Go premium.<br />
            <span style={styles.heroAccent}>Own the experience.</span>
          </h1>
          <p style={styles.heroSub}>
            Join thousands of members who unlocked the full power of our platform.
            No limits. No compromises.
          </p>
        </section>

        {/* ── Main layout ── */}
        <div style={styles.mainGrid}>

          {/* ── Left: Features + Testimonials ── */}
          <div style={styles.leftCol}>
            <p style={styles.sectionLabel}>Everything included</p>
            <div style={styles.featureGrid}>
              {FEATURES.map((f) => (
                <div key={f.title} style={styles.featureCard}>
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <div>
                    <div style={styles.featureTitle}>{f.title}</div>
                    <div style={styles.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.testimonialBox}>
              <div style={styles.stars}>{"★".repeat(5)}</div>
              <p style={styles.testimonialText}>"{TESTIMONIALS[activeTestimonial].text}"</p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.avatar}>{TESTIMONIALS[activeTestimonial].avatar}</div>
                <div>
                  <div style={styles.authorName}>{TESTIMONIALS[activeTestimonial].name}</div>
                  <div style={styles.authorRole}>{TESTIMONIALS[activeTestimonial].role}</div>
                </div>
              </div>
              <div style={styles.dotRow}>
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    style={{ ...styles.dot, ...(i === activeTestimonial ? styles.dotActive : {}) }}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Pricing card ── */}
          <div style={styles.rightCol}>
            <div style={styles.pricingCard}>

              <p style={styles.sectionLabel}>Premium Membership</p>

              {/* Loading skeleton for price */}
              {isFetchingPrice && (
                <div style={styles.priceSkeleton} />
              )}

              {/* Fetch error */}
              {!isFetchingPrice && fetchError && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {fetchError}
                </div>
              )}

              {/* Single plan card — driven by API */}
              {!isFetchingPrice && subscriptionDef && (
                <div style={styles.singlePlanCard}>
                  <div style={styles.planBtnTop}>
                    <span style={styles.planBtnName}>{subscriptionDef.subscriptionName}</span>
                  </div>
                  <div style={styles.planBtnPrice}>
                    ₹{basePrice.toLocaleString()}
                  </div>
                  <div style={styles.planBtnNote}>
                    One-time payment via Razorpay
                  </div>
                </div>
              )}

              {/* Order summary */}
              {!isFetchingPrice && subscriptionDef && (
                <div style={styles.summaryBox}>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Plan</span>
                    <span style={styles.summaryVal}>{subscriptionDef.subscriptionName} · ₹{basePrice.toLocaleString()}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>GST (18%)</span>
                    <span style={styles.summaryVal}>₹{gst.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryDivider} />
                  <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
                    <span>Total today</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handlePurchase}
                disabled={loading || isFetchingPrice || !subscriptionDef}
                style={{
                  ...styles.payBtn,
                  ...(loading || isFetchingPrice || !subscriptionDef ? styles.payBtnDisabled : {}),
                }}
              >
                {loading ? (
                  <span style={styles.spinner} />
                ) : isFetchingPrice ? (
                  <span>Loading price...</span>
                ) : !subscriptionDef ? (
                  <span>Pricing unavailable</span>
                ) : (
                  <>
                    <span>🔒</span>
                    <span>Pay ₹{total.toFixed(2)} with Razorpay</span>
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div style={styles.trustRow}>
                <span style={styles.trustItem}>🛡️ 256-bit SSL</span>
                <span style={styles.trustItem}>↩️ Cancel anytime</span>
                <span style={styles.trustItem}>✓ PCI-DSS</span>
              </div>

              {/* Payment methods */}
              <div style={styles.methodsRow}>
                {["UPI", "Visa", "MC", "RuPay", "NetBanking"].map((m) => (
                  <span key={m} style={styles.methodPill}>{m}</span>
                ))}
              </div>

              <p style={styles.razorpayNote}>
                Payments processed securely by{" "}
                <strong style={{ color: "#92400E" }}>Razorpay</strong>
              </p>
            </div>

            <div style={styles.guaranteeBox}>
              <span style={{ fontSize: 24 }}>💯</span>
              <div>
                <div style={styles.guaranteeTitle}>7-day money-back guarantee</div>
                <div style={styles.guaranteeDesc}>
                  Not happy? We'll refund you in full, no questions asked.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div style={styles.statsBar}>
          {[
            { val: "50K+", label: "Premium members" },
            { val: "4.9★", label: "Average rating" },
            { val: "99.9%", label: "Uptime SLA" },
            { val: "< 2hr", label: "Support response" },
          ].map((s) => (
            <div key={s.label} style={styles.statItem}>
              <div style={styles.statVal}>{s.val}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <footer style={styles.footer}>
          <span>© 2026 Bandookwale</span>
          <span>·</span>
          <a href="#" style={styles.footerLink}>Privacy</a>
          <span>·</span>
          <a href="#" style={styles.footerLink}>Terms</a>
          <span>·</span>
          <a href="mailto:support@bandookwale.com" style={styles.footerLink}>Support</a>
        </footer>
      </div>
    </div>
  );
}

function SuccessScreen({ success }: { success: any }) {
  return (
    <div style={styles.page}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={{ ...styles.container, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center" }}>
        <div style={styles.successIconWrap}>
          <span style={{ fontSize: 40 }}>✓</span>
        </div>
        <h1 style={{ ...styles.heroTitle, marginBottom: "0.5rem" }}>You're premium now!</h1>
        <p style={{ ...styles.heroSub, maxWidth: 420, margin: "0 auto 2rem" }}>
          Your <strong>{success.plan}</strong> membership is active. A receipt has been sent to your email.
        </p>
        <div style={styles.txnBox}>
          <span style={{ color: "#92400E", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Transaction ID</span>
          <div style={{ fontFamily: "monospace", fontSize: 13, marginTop: 4, wordBreak: "break-all" }}>{success.paymentId}</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={styles.payBtn} onClick={() => window.location.href = "/bandookwale"}>
            Go to Dashboard →
          </button>
          <button style={{ ...styles.payBtn, background: "transparent", border: "1.5px solid #B45309", color: "#B45309" }}
            onClick={() => window.location.href = "/bandookwale/profile"}>
            View Membership
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#FFFBF5",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    overflow: "hidden",
  },
  bgOrb1: {
    position: "fixed", top: -120, right: -120,
    width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgOrb2: {
    position: "fixed", bottom: -80, left: -80,
    width: 300, height: 300, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px 48px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "24px 0 0",
  },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 18, color: "#B45309" },
  logoText: { fontSize: 18, fontWeight: 700, color: "#1C1917", letterSpacing: "-0.02em" },
  headerBadge: {
    background: "#FEF3C7", border: "1px solid #FDE68A",
    borderRadius: 20, padding: "6px 14px",
  },
  hero: { textAlign: "center", padding: "56px 0 48px" },
  heroPill: {
    display: "inline-block",
    background: "#FEF3C7", color: "#92400E",
    border: "1px solid #FDE68A",
    borderRadius: 20, padding: "6px 18px",
    fontSize: 13, fontWeight: 500,
    letterSpacing: "0.04em",
    marginBottom: 24,
    fontFamily: "sans-serif",
  },
  heroTitle: {
    fontSize: "clamp(32px, 5vw, 52px)",
    fontWeight: 700,
    color: "#1C1917",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    marginBottom: 16,
  },
  heroAccent: {
    color: "#B45309",
    fontStyle: "italic",
  },
  heroSub: {
    fontSize: 17,
    color: "#78716C",
    lineHeight: 1.7,
    maxWidth: 520,
    margin: "0 auto",
    fontFamily: "sans-serif",
    fontWeight: 400,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 32,
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#A8A29E",
    marginBottom: 12,
    fontFamily: "sans-serif",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  featureCard: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    transition: "border-color 0.2s",
  },
  featureIcon: { fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 },
  featureTitle: {
    fontSize: 14, fontWeight: 600, color: "#1C1917",
    marginBottom: 2, fontFamily: "sans-serif",
  },
  featureDesc: { fontSize: 12, color: "#78716C", lineHeight: 1.5, fontFamily: "sans-serif" },
  testimonialBox: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 16,
    padding: "24px",
  },
  stars: { color: "#F59E0B", fontSize: 16, marginBottom: 12, letterSpacing: 2 },
  testimonialText: {
    fontSize: 15, color: "#1C1917", lineHeight: 1.7,
    fontStyle: "italic", marginBottom: 16,
  },
  testimonialAuthor: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "#FEF3C7", color: "#92400E",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, flexShrink: 0,
    fontFamily: "sans-serif",
  },
  authorName: { fontSize: 14, fontWeight: 600, color: "#1C1917", fontFamily: "sans-serif" },
  authorRole: { fontSize: 12, color: "#78716C", fontFamily: "sans-serif" },
  dotRow: { display: "flex", gap: 6 },
  dot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#D6D3D1", border: "none", cursor: "pointer",
    padding: 0, transition: "background 0.2s, width 0.2s",
  },
  dotActive: { background: "#B45309", width: 18, borderRadius: 3 },
  rightCol: { position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 },
  pricingCard: {
    background: "#FFFFFF",
    border: "1px solid #E7E5E4",
    borderRadius: 20,
    padding: "28px 24px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  priceSkeleton: {
    height: 96,
    borderRadius: 12,
    background: "linear-gradient(90deg, #FAFAF9 25%, #F0EFEE 37%, #FAFAF9 63%)",
    backgroundSize: "400% 100%",
    animation: "shimmer 1.4s ease infinite",
    marginBottom: 20,
  },
  singlePlanCard: {
    background: "#FFFBF5",
    border: "1.5px solid #B45309",
    boxShadow: "0 0 0 3px rgba(180,83,9,0.08)",
    borderRadius: 12,
    padding: "16px 16px",
    marginBottom: 16,
  },
  planBtnTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  planBtnName: { fontSize: 14, fontWeight: 600, color: "#1C1917", fontFamily: "sans-serif" },
  planBtnPrice: { fontSize: 28, fontWeight: 700, color: "#1C1917", lineHeight: 1.2 },
  planBtnNote: { fontSize: 12, color: "#A8A29E", marginTop: 4, fontFamily: "sans-serif" },
  summaryBox: {
    background: "#FAFAF9",
    border: "1px solid #E7E5E4",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 16,
  },
  summaryRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 13, color: "#78716C",
    padding: "4px 0",
    fontFamily: "sans-serif",
  },
  summaryLabel: { color: "#A8A29E" },
  summaryVal: { color: "#1C1917", fontWeight: 500 },
  summaryDivider: { height: 1, background: "#E7E5E4", margin: "8px 0" },
  summaryTotal: {
    fontSize: 15, fontWeight: 700,
    color: "#1C1917", padding: "6px 0 0",
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13, color: "#991B1B",
    marginBottom: 14,
    fontFamily: "sans-serif",
    display: "flex", gap: 8, alignItems: "flex-start",
  },
  payBtn: {
    width: "100%",
    padding: "15px 24px",
    background: "#B45309",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "background 0.15s, transform 0.1s",
    fontFamily: "sans-serif",
    letterSpacing: "-0.01em",
  },
  payBtnDisabled: {
    background: "#D6D3D1",
    cursor: "not-allowed",
    transform: "none",
  },
  spinner: {
    width: 18, height: 18,
    border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  trustRow: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
    flexWrap: "wrap",
  },
  trustItem: {
    fontSize: 11, color: "#A8A29E",
    fontFamily: "sans-serif",
    display: "flex", alignItems: "center", gap: 4,
  },
  methodsRow: {
    display: "flex", flexWrap: "wrap", gap: 6,
    justifyContent: "center", marginTop: 12,
  },
  methodPill: {
    background: "#F5F5F4",
    border: "1px solid #E7E5E4",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 11, fontWeight: 600, color: "#78716C",
    fontFamily: "sans-serif", letterSpacing: "0.04em",
  },
  razorpayNote: {
    textAlign: "center", fontSize: 11,
    color: "#A8A29E", marginTop: 12,
    fontFamily: "sans-serif",
  },
  guaranteeBox: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  guaranteeTitle: { fontSize: 14, fontWeight: 600, color: "#14532D", marginBottom: 3, fontFamily: "sans-serif" },
  guaranteeDesc: { fontSize: 12, color: "#166534", lineHeight: 1.5, fontFamily: "sans-serif" },
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 1,
    background: "#E7E5E4",
    border: "1px solid #E7E5E4",
    borderRadius: 16,
    overflow: "hidden",
    margin: "40px 0 32px",
  },
  statItem: {
    background: "#FFFFFF",
    padding: "20px",
    textAlign: "center",
  },
  statVal: {
    fontSize: 22, fontWeight: 700, color: "#B45309",
    letterSpacing: "-0.03em", marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#78716C", fontFamily: "sans-serif" },
  footer: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, fontSize: 13, color: "#A8A29E",
    fontFamily: "sans-serif",
  },
  footerLink: { color: "#78716C", textDecoration: "none" },
  successIconWrap: {
    width: 80, height: 80, borderRadius: "50%",
    background: "#F0FDF4", border: "2px solid #86EFAC",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 36, color: "#16A34A",
    marginBottom: 24,
  },
  txnBox: {
    background: "#F5F5F4",
    border: "1px solid #E7E5E4",
    borderRadius: 12,
    padding: "14px 20px",
    marginBottom: 24,
    maxWidth: 420,
    width: "100%",
    fontFamily: "sans-serif",
  },
};

// Inject keyframes for spinner + shimmer
if (typeof document !== "undefined" && !document.getElementById("premium-page-keyframes")) {
  const styleTag = document.createElement("style");
  styleTag.id = "premium-page-keyframes";
  styleTag.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
    button:hover:not(:disabled) { opacity: 0.92; }
  `;
  document.head.appendChild(styleTag);
}