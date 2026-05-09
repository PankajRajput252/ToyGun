import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../context/AuthContext";

declare global { interface Window { Razorpay: any; } }

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface SubscriptionDefinition {
  subscriptionDefinitionPkId: number;
  subscriptionName: string;
  subscriptionAmount: number;
}

const API_URL = "http://bandookWale.eba-55irbrg4.ap-south-1.elasticbeanstalk.com";
const RAZORPAY_KEY = "rzp_test_Sk36cjHZNLcY5o"; // ← your key

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [name, setName] = useState("");
  const [nationalIdType, setNationalIdType] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [position] = useState("Left");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [subscriptionDef, setSubscriptionDef] = useState<SubscriptionDefinition | null>(null);
  const [isFetchingCharge, setIsFetchingCharge] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // ─── Fetch registration charge on mount ──────────────────────────────────────
  useEffect(() => {
    const fetchCharge = async () => {
      try {
        setIsFetchingCharge(true);
        const res = await fetch(
          `${API_URL}/api/users/getSubscriptionDefinition?page=0&size=10&filterBy=ACTIVE&inputPkId=null&inputFkId=null`
        );
        const data = await res.json();
        console.log("Subscription definition:", data.data[0]);
        const list: SubscriptionDefinition[] =data.data;
          // Array.isArray(data?.data) ? data.data :
          // Array.isArray(data?.content) ? data.content :
          // Array.isArray(data) ? data : [];
        if (list.length > 0) setSubscriptionDef(list[0]);
        console.log("sub-->",subscriptionDef)
      } catch (err) {
        console.error("Failed to fetch registration charge:", err);
      } finally {
        setIsFetchingCharge(false);
      }
    };
    fetchCharge();
  }, []);

  // ─── Validate ─────────────────────────────────────────────────────────────────
  const validateForm = (): string | null => {
    if (!isChecked) return "You must agree to the Terms and Conditions";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!name || !email || !password || !mobile || !country || !nationalId || !nationalIdType)
      return "Please fill in all required fields";
    return null;
  };

  // ─── Submit handler ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setGeneratedUsername("");
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    if (!subscriptionDef || subscriptionDef.subscriptionAmount <= 0) {
      await registerUser(); return;
    }
    await initiateRegistrationPayment();
  };

  // ─── Open Razorpay ────────────────────────────────────────────────────────────
  const initiateRegistrationPayment = async () => {
    try {
      setIsPaymentLoading(true);
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        setError("Failed to load payment gateway. Please check your internet connection.");
        setIsPaymentLoading(false);
        return;
      }
      const options = {
        key: RAZORPAY_KEY,
        amount: Math.round(subscriptionDef!.subscriptionAmount * 100),
        currency: "INR",
        name: "Bandookwale",
        description: subscriptionDef!.subscriptionName || "Registration Fee",
        prefill: { name, email, contact: mobile },
        notes: {
          subscriptionCode: subscriptionDef!.subscriptionCode,
          subscriptionId: subscriptionDef!.subscriptionDefinitionPkId,
          purpose: "registration",
        },
        theme: { color: "#EAB308" },
        handler: async (razorpayResponse: any) => {
          console.log("Registration payment success:", razorpayResponse);
          setIsPaymentLoading(false);
          await registerUser(razorpayResponse);
        },
        modal: {
          ondismiss: () => {
            setIsPaymentLoading(false);
            setError("Payment was cancelled. Please complete payment to register.");
          },
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response: any) => {
        setIsPaymentLoading(false);
        setError(`Payment failed: ${response.error.description}. Please try again.`);
      });
      razorpay.open();
    } catch (err: any) {
      setIsPaymentLoading(false);
      setError(`Payment error: ${err.message || "Please try again."}`);
    }
  };

  // ─── Register user (after payment or directly) ────────────────────────────────
  const registerUser = async (razorpayResponse?: any) => {
    setIsLoading(true);
    try {
      console.log("Registering with referral:", referralCode);
      const result = await signUp(
        name, email, password, mobile, country,
        referralCode, position, nationalIdType, nationalId,
        razorpayResponse ? {
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
          subscriptionId: subscriptionDef?.subscriptionDefinitionPkId,
          amountPaid: subscriptionDef?.subscriptionAmount,
        } : undefined
      );
      if (result.success) {
        setSuccess(result.message || "Registration successful!");
        if (result.username) setGeneratedUsername(result.username);
      } else {
        setError(result.message || "Registration failed. Please check your information.");
      }
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-10 lg:px-16">
      <div className="w-full max-w-2xl p-[2px] rounded-2xl bg-gradient-to-r from-white to-yellow-500">
        <div className="w-full px-8 py-8 rounded-2xl bg-white dark:bg-gray-900">

          {/* Skeleton while fetching charge */}
          {isFetchingCharge && (
            <div className="mb-4 h-16 animate-pulse bg-yellow-50 rounded-xl border border-yellow-100" />
          )}

          {/* Registration fee banner */}
          {!isFetchingCharge && subscriptionDef && subscriptionDef.subscriptionAmount > 0 && (
            <div className="mb-5 flex items-center justify-between
                            bg-yellow-50 dark:bg-yellow-900/20
                            border border-yellow-200 dark:border-yellow-800
                            rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Registration Fee Required
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                  {subscriptionDef.subscriptionName} — Pay via Razorpay to complete signup
                </p>
                <p className="text-[10px] text-yellow-600 dark:text-yellow-500 mt-1">
                  🔒 Secured by Razorpay
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  ₹{subscriptionDef.subscriptionAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 mb-3 text-sm text-red-800 bg-red-100 border border-red-200
                            rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 mb-3 text-sm text-green-800 bg-green-100 border border-green-200
                            rounded-lg dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              {success}
            </div>
          )}

          {/* Credentials */}
          {generatedUsername && (
            <div className="p-4 mb-3 text-sm text-blue-800 bg-blue-100 border border-blue-200
                            rounded-lg dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
              <div className="font-semibold mb-2">Your Login Credentials:</div>
              <div className="space-y-1">
                <div>
                  <strong>Username:</strong>{" "}
                  <span className="font-mono bg-white/50 px-2 py-1 rounded">{generatedUsername}</span>
                </div>
                <div>
                  <strong>Password:</strong>{" "}
                  <span className="font-mono bg-white/50 px-2 py-1 rounded">[The password you entered]</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">

              {/* Name + Country */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Name<span className="text-error-500">*</span></Label>
                  <Input type="text" id="name" name="name" placeholder="Enter Full Name"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Country<span className="text-error-500">*</span></Label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-normal text-gray-700 transition-colors
                               bg-white border border-gray-300 rounded-lg focus:border-brand-500
                               focus:outline-none focus:ring-2 focus:ring-brand-500/20
                               dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                    <option value="">Select country</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="China">China</option>
                    <option value="Brazil">Brazil</option>
                  </select>
                </div>
              </div>

              {/* Mobile + Email */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Mobile<span className="text-error-500">*</span></Label>
                  <Input type="tel" id="mobile" name="mobile" placeholder="Enter Your Mobile"
                    value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>
                <div>
                  <Label>Email<span className="text-error-500">*</span></Label>
                  <Input type="email" id="email" name="email" placeholder="Enter Your Email"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Password + Confirm */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Password<span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input placeholder="Enter Your Password"
                      type={showPassword ? "text" : "password"}
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                    <span onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                      {showPassword
                        ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Confirm Password<span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input placeholder="Enter Confirm Password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <span onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                      {showPassword
                        ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                    </span>
                  </div>
                </div>
              </div>

              {/* National ID Type + ID */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>NationalId Type<span className="text-error-500">*</span></Label>
                  <select value={nationalIdType} onChange={(e) => setNationalIdType(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-normal text-gray-700 transition-colors
                               bg-white border border-gray-300 rounded-lg focus:border-brand-500
                               focus:outline-none focus:ring-2 focus:ring-brand-500/20
                               dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                    <option value="">Select NationalId Type</option>
                    <option value="Passport">Passport</option>
                    <option value="AadharCard">Aadhar Card</option>
                    <option value="PanCard">PAN Card</option>
                    <option value="DrivingLincense">Driving Licence</option>
                  </select>
                </div>
                <div>
                  <Label>National Id<span className="text-error-500">*</span></Label>
                  <Input type="text" id="nationalId" name="nationalId"
                    placeholder="Enter National Id" value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)} />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center gap-3">
                <Checkbox className="w-5 h-5" checked={isChecked} onChange={setIsChecked} />
                <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                  By creating an account means you agree to the{" "}
                  <span className="text-gray-800 dark:text-white/90">Terms and Conditions,</span>{" "}
                  and our <span className="text-gray-800 dark:text-white">Privacy Policy</span>
                </p>
              </div>

              {/* Submit */}
              <div>
                {generatedUsername ? (
                  <div className="space-y-3">
                    <button type="button" onClick={() => navigate("/bandookwale/signin")}
                      className="flex items-center justify-center w-full px-4 py-3 text-sm
                                 font-medium text-white transition rounded-lg bg-green-500
                                 shadow-theme-xs hover:bg-green-600">
                      Continue to Sign In
                    </button>
                    <button type="button"
                      onClick={() => { setSuccess(""); setGeneratedUsername(""); setError(""); }}
                      className="flex items-center justify-center w-full px-4 py-3 text-sm
                                 font-medium text-gray-700 transition rounded-lg bg-gray-100
                                 shadow-theme-xs hover:bg-gray-200 dark:bg-gray-700
                                 dark:text-gray-300 dark:hover:bg-gray-600">
                      Register Another Account
                    </button>
                  </div>
                ) : (
                  <button type="submit"
                    disabled={isLoading || isPaymentLoading || isFetchingCharge}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm
                               font-medium text-white transition rounded-lg bg-brand-500
                               shadow-theme-xs hover:bg-brand-600
                               disabled:opacity-50 disabled:cursor-not-allowed">
                    {isPaymentLoading ? "Opening Payment..."
                      : isLoading ? "Creating account..."
                      : isFetchingCharge ? "Loading..."
                      : subscriptionDef && subscriptionDef.subscriptionAmount > 0
                      ? `Pay ₹${subscriptionDef.subscriptionAmount.toLocaleString()} & Sign Up`
                      : "Sign Up"}
                  </button>
                )}
              </div>

            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?{" "}
              <Link to="/bandookwale/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}