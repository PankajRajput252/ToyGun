import { useState, useEffect, useRef } from "react";

// ─── CONFIG — replace with your real values ───────────────────────
const API_BASE = "http://bandookWale.eba-55irbrg4.ap-south-1.elasticbeanstalk.com/api/v1";
const PREMIUM_PRODUCT_ID = 1;
// ─────────────────────────────────────────────────────────────────

const PLANS = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    price: 499,
    billingNote: "Billed every month",
    badge: null,
  },
  yearly: {
    id: "yearly",
    label: "Yearly",
    price: 3588,
    perMonth: 299,
    billingNote: "Billed ₹3,588 / year",
    badge: "Save 40%",
  },
};

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

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef(null);

  const plan = PLANS[selectedPlan];
  const gst = +(plan.price * 0.18).toFixed(2);
  const total = +(plan.price + gst).toFixed(2);

  // auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const getToken = () => localStorage.getItem("token") || "";

  const handlePurchase = async () => {
    setError("");
    setLoading(true);
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) throw new Error("Could not load Razorpay. Check your connection.");

      // 1. Create order on backend
      const orderRes = await fetch(`${API_BASE}/payments/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          productId: PREMIUM_PRODUCT_ID,
          currency: "INR",
          notes: `Premium ${plan.label} membership`,
        }),
      });
      if (!orderRes.ok) throw new Error("Failed to create payment order. Please try again.");
      const order = await orderRes.json();

      // 2. Open Razorpay checkout
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: order.currency || "INR",
        name: "Premium Membership",
        description: `${plan.label} Plan`,
        order_id: order.razorpayOrderId,
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#B45309" },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response) => {
          // 3. Verify payment on backend
          const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            setSuccess({
              paymentId: response.razorpay_payment_id,
              plan: plan.label,
              amount: total,
            });
          } else {
            setError("Payment verification failed. Contact support with your payment ID.");
          }
          setLoading(false);
        },
      };
      new window.Razorpay(options).open();
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) return <SuccessScreen success={success} />;

  return (
    <div style={styles.page}>
      {/* ── Background decorations ── */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <div style={styles.container}>

        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>◆</span>
            <span style={styles.logoText}>YourApp</span>
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

            {/* Testimonials */}
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

              {/* Plan toggle */}
              <p style={styles.sectionLabel}>Choose your plan</p>
              <div style={styles.planToggle}>
                {Object.values(PLANS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      ...styles.planBtn,
                      ...(selectedPlan === p.id ? styles.planBtnActive : {}),
                    }}
                  >
                    <div style={styles.planBtnTop}>
                      <span style={styles.planBtnName}>{p.label}</span>
                      {p.badge && (
                        <span style={styles.planBtnBadge}>{p.badge}</span>
                      )}
                    </div>
                    <div style={styles.planBtnPrice}>
                      {p.perMonth ? (
                        <>₹{p.perMonth}<span style={styles.planBtnPer}>/mo</span></>
                      ) : (
                        <>₹{p.price}<span style={styles.planBtnPer}>/mo</span></>
                      )}
                    </div>
                    <div style={styles.planBtnNote}>{p.billingNote}</div>
                  </button>
                ))}
              </div>

              {/* Order summary */}
              <div style={styles.summaryBox}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Plan</span>
                  <span style={styles.summaryVal}>{plan.label} · ₹{plan.price}</span>
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

              {/* Error */}
              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handlePurchase}
                disabled={loading}
                style={{ ...styles.payBtn, ...(loading ? styles.payBtnDisabled : {}) }}
              >
                {loading ? (
                  <span style={styles.spinner} />
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

            {/* Money-back guarantee */}
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
          <span>© 2026 YourApp</span>
          <span>·</span>
          <a href="#" style={styles.footerLink}>Privacy</a>
          <span>·</span>
          <a href="#" style={styles.footerLink}>Terms</a>
          <span>·</span>
          <a href="mailto:support@yourapp.com" style={styles.footerLink}>Support</a>
        </footer>
      </div>
    </div>
  );
}

function SuccessScreen({ success }) {
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
          <button style={styles.payBtn} onClick={() => window.location.href = "/dashboard"}>
            Go to Dashboard →
          </button>
          <button style={{ ...styles.payBtn, background: "transparent", border: "1.5px solid #B45309", color: "#B45309" }}
            onClick={() => window.location.href = "/profile"}>
            View Membership
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = {
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
  planToggle: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
  planBtn: {
    background: "#FAFAF9",
    border: "1.5px solid #E7E5E4",
    borderRadius: 12,
    padding: "14px 12px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
    fontFamily: "serif",
  },
  planBtnActive: {
    background: "#FFFBF5",
    border: "1.5px solid #B45309",
    boxShadow: "0 0 0 3px rgba(180,83,9,0.08)",
  },
  planBtnTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  planBtnName: { fontSize: 13, fontWeight: 600, color: "#1C1917", fontFamily: "sans-serif" },
  planBtnBadge: {
    fontSize: 10, fontWeight: 700, color: "#92400E",
    background: "#FEF3C7", padding: "2px 8px", borderRadius: 10,
    letterSpacing: "0.05em", textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  planBtnPrice: { fontSize: 22, fontWeight: 700, color: "#1C1917", lineHeight: 1.2 },
  planBtnPer: { fontSize: 13, fontWeight: 400, color: "#78716C" },
  planBtnNote: { fontSize: 11, color: "#A8A29E", marginTop: 2, fontFamily: "sans-serif" },
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

// Inject keyframes for spinner
const styleTag = document.createElement("style");
styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } }
  button:hover:not(:disabled) { opacity: 0.92; }`;
document.head.appendChild(styleTag);