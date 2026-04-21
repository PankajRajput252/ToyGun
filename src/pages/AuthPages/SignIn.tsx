import { useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import Footer from "../../components/footer/Footer";

export default function SignIn() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PageMeta
        title="BandookWale - Sign In"
        description="BandookWale Sign In"
      />

      {/* MAIN AUTH AREA */}
      <div className="flex-1 overflow-hidden">
        <AuthLayout>
          <SignInForm />
        </AuthLayout>
      </div>

      {/* FOOTER WITHOUT ANY SCROLL */}
      {/* <div className="shrink-0">
        <Footer />
      </div> */}
    </div>
  );
}
