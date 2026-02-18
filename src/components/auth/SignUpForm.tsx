import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../context/AuthContext";

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
  const [position, setPosition] = useState("Left");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setGeneratedUsername("");

    if (!isChecked) {
      setError("You must agree to the Terms and Conditions");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!name || !email || !password || !mobile || !country || !nationalId || !nationalIdType) {
      setError("Please fill in all required fields");
      return;
    }


    setIsLoading(true);

    try {
      console.log("Please referal  565--->",referralCode);
      const result = await signUp(name, email, password, mobile, country, referralCode, position,nationalIdType,nationalId);
      if (result.success) {
        setSuccess(result.message || "Registration successful!");
        if (result.username) {
          setGeneratedUsername(result.username);
        }
        // Don't navigate immediately, let user see their username
        // navigate("/StyloCoin/");
      } else {
        setError(result.message || "Registration failed. Please check your information and try again.");
      }
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
   
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up for Container Shipment
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your account to get started!
            </p>
            {error && (
              <div className="p-3 mt-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 mt-3 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                {success}
              </div>
            )}
            {generatedUsername && (
              <div className="p-4 mt-3 text-sm text-blue-800 bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                <div className="font-semibold mb-2">Your Login Credentials:</div>
                <div className="space-y-1">
                  <div><strong>Username:</strong> <span className="font-mono bg-white/50 px-2 py-1 rounded">{generatedUsername}</span></div>
                  <div><strong>Password:</strong> <span className="font-mono bg-white/50 px-2 py-1 rounded">[The password you entered]</span></div>
                </div>
                <div className="mt-3 text-xs text-blue-600 dark:text-blue-300">
                  Please save these credentials. You'll need them to sign in.
                </div>
              </div>
            )}
          </div>
          <div>
         
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* <!-- Name and Country Row --> */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>
                      Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>
                      Country<span className="text-error-500">*</span>
                    </Label>
                    <select
                      id="country"
                      name="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 text-sm font-normal text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-brand-400"
                    >
                      <option value="">Select country--</option>
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

                {/* <!-- Mobile and Email Row --> */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>
                      Mobile<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      placeholder="Enter Your Mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>
                      Email<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter Your Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* <!-- Password and Confirm Password Row --> */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>
                      Password<span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Enter Your Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>
                      Confirm Password<span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Enter Confirm Password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                 <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                 
                  <div>
                    <Label>
                      NationalId Type<span className="text-error-500">*</span>
                    </Label>
                    <select
                      id="nationalIdType"
                      name="nationalIdType"
                      value={nationalIdType}
                      onChange={(e) => setNationalIdType(e.target.value)}
                      className="w-full px-4 py-3 text-sm font-normal text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-brand-400"
                    >
                      <option value="">Select NationalId Type--</option>
                      <option value="Passport">Passport</option>
                      <option value="AadharCard">Aadhar Card</option>
                      <option value="PanCard">PAN Card</option>
                      <option value="DrivingLincense">Driving Lincense</option>
                    </select>
                  </div>

                   <div>
                    <Label>
                      National Id<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="nationalId"
                      name="nationalId"
                      placeholder="Enter national Id"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                    />
                  </div>
                </div>

                {/* <!-- Referral Code and Position Row --> */}
                {/* <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>
                      Referral Code
                    </Label>
                    <Input
                      type="text"
                      id="referralCode"
                      name="referralCode"
                      placeholder="Enter Your Referral Code"
                      value={referralCode}
                      // onChange={(e) => setReferralCode(e.target.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setReferralCode(value == "" ? "NODE24770625" : value);
                      }}
                    />
                  </div>
                  <div>
                    <Label>
                      Position<span className="text-error-500">*</span>
                    </Label>
                    <select
                      id="position"
                      name="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-4 py-3 text-sm font-normal text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-brand-400"
                    >
                      <option value="Left">Left</option>
                      <option value="Right">Right</option>
                    </select>
                  </div>
                </div> */}
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">
                      Privacy Policy
                    </span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  {generatedUsername ? (
                    <div className="space-y-3">
                      <button 
                        type="button"
                        onClick={() => navigate("/StyloCoin/signin")}
                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-green-500 shadow-theme-xs hover:bg-green-600"
                      >
                        Continue to Sign In
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setSuccess("");
                          setGeneratedUsername("");
                          setError("");
                        }}
                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 transition rounded-lg bg-gray-100 shadow-theme-xs hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Register Another Account
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="submit" 
                      className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Sign Up"}
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account? {" "}
                <Link
                  to="/StyloCoin/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
