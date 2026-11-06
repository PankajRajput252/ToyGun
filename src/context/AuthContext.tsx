import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usersApi } from "../services/api";
import { API_BASE_URL } from "../services/apiBase";

interface User {
  userPkId?: number;
  versionId?: string;
  nodeId?: string;
  name: string;
  email: string;
  username?: string;
  about?: string;
  country?: string;
  mobile?: string;
  referralCode?: string;
  position?: string;
  userStatus?: string | null;
  parentNodeId?: string | null;
  transactionPassword?: string | null;
  dateOfActivation?: string | null;
  isUserIsAdmin?: boolean;
  roles?: Array<{ roleId: number; name: string }>;
  authorities?: Array<{ authority: string }>;
  enabled?: boolean;
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
  isConfirmed?: boolean;
  imageUrl?: string | null;
  profileImageUrl?: string | null;
  imageId?: string | null;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  nationalIdType?: string;
  nationalId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (
    username: string,
    password: string,
    keepLoggedIn?: boolean
  ) => Promise<boolean>;
  signUp: (
    name: string,
    email: string,
    password: string,
    mobile: string,
    country: string,
    referralCode?: string,
    position?: string,
    nationalIdType?: string,
    nationalId?: string
  ) => Promise<{
    success: boolean;
    username?: string;
    message?: string;
  }>;
  signOut: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auto sign-out after this long without any user activity. The last-activity time
// lives in localStorage so it survives reloads and is shared between open tabs.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const LAST_ACTIVITY_KEY = "stylocoin_last_activity";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"];

const markActivity = () => localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

// A session with no recorded activity (e.g. from before this check existed) counts as expired
const isSessionIdle = () => {
  const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
  return !last || Date.now() - last > IDLE_TIMEOUT_MS;
};

// Sign out when the site's tabs are closed — including on mobile, where swiping Chrome
// away from recent apps kills it without a reliable pagehide, and Chrome later restores
// the tab together with its sessionStorage.
// Each tab keeps a heartbeat in localStorage. A page load continues the session only if
//  - this same tab checked in a few seconds ago (a reload), or
//  - another tab of the site is still open and checking in.
const TAB_ID_KEY = "stylocoin_tab_id";
const OPEN_TABS_KEY = "stylocoin_open_tabs";
const TAB_HEARTBEAT_MS = 20 * 1000;
// Chrome runs timers in background tabs only about once a minute, so allow for that
const TAB_STALE_MS = 2 * 60 * 1000;
// A reload writes the heartbeat on pagehide and loads again within a few seconds
const TAB_RESUME_MS = 15 * 1000;

type TabEntry = { seen: number; closed?: boolean };

const readOpenTabs = (): Record<string, TabEntry> => {
  try {
    const tabs = JSON.parse(localStorage.getItem(OPEN_TABS_KEY) || "{}");
    return tabs && typeof tabs === "object" ? tabs : {};
  } catch {
    return {};
  }
};

const writeOpenTabs = (tabs: Record<string, TabEntry>) =>
  localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(tabs));

// Worked out once per page load, before this tab writes its own heartbeat
const tabId = sessionStorage.getItem(TAB_ID_KEY) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
sessionStorage.setItem(TAB_ID_KEY, tabId);
const tabsAtLoad = readOpenTabs();
const ownEntry = tabsAtLoad[tabId];
const isReloadedTab = !!ownEntry?.seen && Date.now() - ownEntry.seen < TAB_RESUME_MS;
const anotherTabOpen = Object.entries(tabsAtLoad).some(
  ([id, tab]) => id !== tabId && !tab?.closed && !!tab?.seen && Date.now() - tab.seen < TAB_STALE_MS
);
// The previous session ended when its tabs were closed or the browser was killed
const tabsWereClosed = !isReloadedTab && !anotherTabOpen;

const writeTab = (closed = false) => {
  const now = Date.now();
  const tabs = readOpenTabs();
  // drop entries from tabs that were closed or killed a while ago
  Object.keys(tabs).forEach((id) => {
    if (!tabs[id]?.seen || now - tabs[id].seen > TAB_STALE_MS) delete tabs[id];
  });
  tabs[tabId] = closed ? { seen: now, closed: true } : { seen: now };
  writeOpenTabs(tabs);
};

const touchTab = () => writeTab();
// pagehide fires on close and on reload; a reload is recognised by the fresh timestamp
const closeTab = () => writeTab(true);

// Helper function to check if user is admin based on roles
export const isUserAdmin = (user: User | null): boolean => {
  if (!user) return false;

  return user.roles?.some((role) => role.name === "ADMIN_USER") || false;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // API Base URL
  const apiBaseUrl = API_BASE_URL;

  console.log("API Base URL:", apiBaseUrl);

  // Pull the latest profile (incl. profile image) from the server and merge it
  // into the stored user, keeping the existing image if the server omits it
  const refreshUserFromServer = async (baseUser: User) => {
    if (!baseUser?.userPkId) return;
    try {
      const fetchedUser = await usersApi.getById(baseUser.userPkId);
      if (!fetchedUser) return;
      const imageUrl =
        fetchedUser.profileImageUrl ||
        fetchedUser.imageUrl ||
        baseUser.profileImageUrl ||
        baseUser.imageUrl ||
        null;
      const mergedUser = {
        ...baseUser,
        ...fetchedUser,
        profileImageUrl: imageUrl,
        imageUrl,
      } as User;
      setUser(mergedUser);
      localStorage.setItem("stylocoin_user", JSON.stringify(mergedUser));
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("stylocoin_user");
    const keepLoggedIn = localStorage.getItem(
      "stylocoin_keep_logged_in"
    );

    if (storedUser) {
      if (tabsWereClosed || isSessionIdle()) {
        // All tabs were closed, or idle for more than 15 minutes — don't restore the session.
        // Several modules read stylocoin_user once at import time, so reload to reset them.
        signOut();
        window.location.reload();
        return;
      } else if (keepLoggedIn === "true" || keepLoggedIn === null) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        markActivity();
        refreshUserFromServer(parsedUser);
      }
    }

    setIsLoading(false);
  }, []);

  // Keep this tab's heartbeat fresh while it's open, and mark it closed when the page goes away
  useEffect(() => {
    touchTab();
    const intervalId = window.setInterval(touchTab, TAB_HEARTBEAT_MS);
    // Mobile browsers freeze timers in the background, so also record the moment the
    // tab is hidden or shown — that's the last heartbeat if Chrome is then killed
    document.addEventListener("visibilitychange", touchTab);
    window.addEventListener("pagehide", closeTab);
    // A page restored from the back/forward cache is open again
    window.addEventListener("pageshow", touchTab);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", touchTab);
      window.removeEventListener("pagehide", closeTab);
      window.removeEventListener("pageshow", touchTab);
    };
  }, []);

  // While signed in, record activity and sign out once the user has been idle for 15 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    // Activity events fire constantly; writing the timestamp every few seconds is enough
    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 5000) {
        lastWrite = now;
        markActivity();
      }
    };

    const checkIdle = () => {
      if (isSessionIdle()) {
        signOut();
        window.location.assign("/signin");
      }
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    // Timers are throttled in background tabs, so also check as soon as the tab is shown again
    const onVisible = () => document.visibilityState === "visible" && checkIdle();
    document.addEventListener("visibilitychange", onVisible);
    const intervalId = window.setInterval(checkIdle, 30 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const signIn = async (
    username: string,
    password: string,
    keepLoggedIn: boolean = false
  ): Promise<boolean> => {
    try {
      console.log("Attempting login with:", {
        username,
        apiBaseUrl,
      });

      const controller = new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 25000);

      const response = await fetch(
        `${apiBaseUrl}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
          signal: controller.signal,
        }
      ).finally(() => clearTimeout(timeoutId));

      console.log("Login response status:", response.status);

      const responseData = await response.json();

      console.log("Login response data:", responseData);

      if (response.ok) {
        if (responseData.user && responseData.token) {
          console.log("Backend returned user data:", responseData.user);

          setUser(responseData.user);
          setIsAuthenticated(true);

          localStorage.setItem(
            "stylocoin_user",
            JSON.stringify(responseData.user)
          );

          localStorage.setItem(
            "stylocoin_keep_logged_in",
            keepLoggedIn.toString()
          );

          localStorage.setItem(
            "stylocoin_token",
            responseData.token
          );

          // Start the 15-minute idle timer from the moment of login
          markActivity();

          // Login payload may not include the profile image; fetch the full profile
          refreshUserFromServer(responseData.user);

          return true;
        } else {
          console.error(
            "Login successful but no user data received:",
            responseData
          );

          return false;
        }
      } else {
        console.error(
          "Login failed with status:",
          response.status
        );

        console.error("Login error data:", responseData);

        return false;
      }
    } catch (error) {
      console.error("Login network error:", error);

      return false;
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    mobile: string,
    country: string,
    referralCode: string = "",
    position: string = "Right",
    nationalIdType?: string,
    nationalId?: string
  ): Promise<{
    success: boolean;
    username?: string;
    message?: string;
  }> => {
    try {
      console.log("Attempting registration with:", {
        name,
        email,
        apiBaseUrl,
      });

      const controller = new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 25000);

      const response = await fetch(
        `${apiBaseUrl}/api/v1/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userPkId: null,
            versionId: null,
            name,
            email,
            password,
            about: null,
            country,
            mobile,
            referralCode,
            position,
            nationalIdType,
            nationalId,
          }),
          signal: controller.signal,
        }
      ).finally(() => clearTimeout(timeoutId));

      console.log(
        "Registration response status:",
        response.status
      );

      // Body may be JSON, plain text or empty; keep whatever the API sent
      const rawBody = await response.text();
      let responseData: any = {};
      try {
        responseData = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        responseData = { message: rawBody };
      }
      const apiMessage: string | undefined =
        responseData.message || responseData.status || responseData.error || undefined;

      console.log("Registration response data:", responseData);

      // The API can answer 200 with an error in the body, so also check the body for failure signs
      const statusText = String(responseData.status ?? responseData.statusCode ?? "").toUpperCase();
      const bodyFailed =
        responseData.success === false ||
        Boolean(responseData.error) ||
        /FAIL|ERROR|BAD_REQUEST|CONFLICT|^[45]\d\d$/.test(statusText);
      // A generated username is a single token; text with spaces is a message, not a username
      const looksLikeUsername =
        typeof responseData.message === "string" && /^\S+$/.test(responseData.message.trim());

      if (response.ok && !bodyFailed && (looksLikeUsername || !responseData.message)) {
        const generatedUsername = looksLikeUsername ? responseData.message.trim() : "";

        if (generatedUsername) {
          localStorage.setItem(
            "stylocoin_generated_username",
            generatedUsername
          );

          return {
            success: true,
            username: generatedUsername,
            message: `Registration successful! Your username is: ${generatedUsername}`,
          };
        } else {
          return {
            success: true,
            message: apiMessage || `Registration successful (status ${response.status})`,
          };
        }
      } else {
        return {
          success: false,
          message:
            apiMessage ||
            `Registration failed (status ${response.status}). Please try again.`,
        };
      }
    } catch (error) {
      console.error("Registration network error:", error);

      return {
        success: false,
        message:
          "Network error occurred during registration. Please try again.",
      };
    }
  };

  const signOut = () => {
    setUser(null);
    setIsAuthenticated(false);

    localStorage.removeItem("stylocoin_user");
    localStorage.removeItem("stylocoin_keep_logged_in");
    localStorage.removeItem("stylocoin_token");
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);

    localStorage.setItem(
      "stylocoin_user",
      JSON.stringify(updatedUser)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin: isUserAdmin(user),
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}