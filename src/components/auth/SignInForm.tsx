import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Auto-populate username if it was generated during registration
  useEffect(() => {
    const generatedUsername = localStorage.getItem("stylocoin_generated_username");
    if (generatedUsername) {
      setUsername(generatedUsername);
      // Clear the stored username after using it
      localStorage.removeItem("stylocoin_generated_username");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      setIsLoading(false);
      return;
    }

    try {
      const success = await signIn(username, password, isChecked);
      if (success) {
        navigate("/bandookwale/");
      } else {
        setError("Login failed. Please check your credentials and try again. If the problem persists, contact support.");
      }
    } catch (err) {
      console.error('SignIn form error:', err);
      setError("Network error occurred. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };
 return (
  <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
    
    {/* Gradient Border Wrapper */}
    <div className="w-full max-w-lg p-[2px] rounded-2xl bg-gradient-to-r from-white to-yellow-500">
      
      {/* Inner Card */}
      <div className="w-full p-6 rounded-2xl bg-white dark:bg-gray-900">
        
        <div className="mb-5 sm:mb-8 text-center sm:text-left">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Sign In
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Access the product using your userId and passcode!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <Label>
                Username <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 size-5" />
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-gray-700 text-theme-sm dark:text-gray-400">
                  Keep me logged in
                </span>
              </div>

              <Link
                to="#!"
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              className="w-full"
              size="sm"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <div className="mt-5 text-center sm:text-left">
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/bandookwale/signup"
              className="text-brand-500 hover:text-brand-600"
            >
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  </div>
);
}
