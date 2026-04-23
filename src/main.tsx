import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import Footer from "./components/footer/Footer.tsx";
import HeroBanner from "./pages/HeroBanner.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper>
          {/* <HeroBanner /> */}
          <App />
          {/* <Footer/> */}
        </AppWrapper>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
