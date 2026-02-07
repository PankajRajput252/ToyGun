import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  isConfirmed?: boolean; // User confirmation status for mining access
  imageUrl?: string | null; // User profile image URL (deprecated, use profileImageUrl)
  profileImageUrl?: string | null; // User profile image URL from API
  imageId?: string | null; // User profile image ID
  // Additional fields from backend
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string, keepLoggedIn?: boolean) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, mobile: string, country: string, referralCode?: string, position?: string) => Promise<{ success: boolean; username?: string; message?: string }>;
  signOut: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to check if user is admin based on roles
export const isUserAdmin = (user: User | null): boolean => {
  if (!user) return false;
  
  // Check if user has ADMIN_USER role
  return user.roles?.some(role => role.name === "ADMIN_USER") || false;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("stylocoin_user");
    const keepLoggedIn = localStorage.getItem("stylocoin_keep_logged_in");
    
    // Restore user session if:
    // 1. User data exists AND keepLoggedIn is "true", OR
    // 2. User data exists and no keepLoggedIn preference set (for auto-login after signup)
    // 3. Don't restore if keepLoggedIn is explicitly "false"
    if (storedUser) {
      if (keepLoggedIn === "true" || keepLoggedIn === null) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    }
    
    // Set loading to false after checking localStorage
    setIsLoading(false);
  }, []);

  const signIn = async (username: string, password: string, keepLoggedIn: boolean = false): Promise<boolean> => {
    try {
      // In production, use relative URLs so Netlify proxy handles CORS
      const apiBaseUrl = import.meta.env.PROD
        ? ''
        : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
      
      console.log('Attempting login with:', { username, apiBaseUrl });
      console.log('Keep logged in:123', apiBaseUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      console.log('Login response data:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.json();
      console.log('Login response data:', responseData);

      if (response.ok) {
        // Check if the response contains valid user data
        if (responseData.user && responseData.token) {
          console.log('Backend returned user data:', responseData.user);
          console.log('Backend roles:', responseData.user.roles);
          
          // Store user data and authentication state
          setUser(responseData.user);
          setIsAuthenticated(true);
          localStorage.setItem("stylocoin_user", JSON.stringify(responseData.user));
          localStorage.setItem("stylocoin_keep_logged_in", keepLoggedIn.toString());
          
          // Store auth token if provided
          if (responseData.token) {
            localStorage.setItem("stylocoin_token", responseData.token);
          }
          
          return true;
        } else {
          console.error('Login successful but no user data received:', responseData);
          return false;
        }
      } else {
        console.error('Login failed with status:', response.status);
        console.error('Login error data:', responseData);
        
        // Check if there's a specific error message
        if (responseData.errorMsg) {
          console.error('Server error message:', responseData.errorMsg);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Login network error:', error);
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
    position: string = "Right"
  ): Promise<{ success: boolean; username?: string; message?: string }> => {
    try {
      // In production, use relative URLs so Netlify proxy handles CORS
      const apiBaseUrl = import.meta.env.PROD
        ? ''
        : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
      
      console.log('Attempting registration with:', { name, email, apiBaseUrl });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      console.log('Registration response status:', response.status);
      const responseData = await response.json();
      console.log('Registration response data:', responseData);

      if (response.ok) {
        // Extract username from the message field
        const generatedUsername = responseData.message;
        
        if (generatedUsername) {
          console.log('Generated username:', generatedUsername);
          
          // Store the generated username for potential auto-login
          localStorage.setItem("stylocoin_generated_username", generatedUsername);
          
          return {
            success: true,
            username: generatedUsername,
            message: `Registration successful! Your username is: ${generatedUsername}`
          };
        } else {
          console.error('Registration successful but no username generated');
          return {
            success: false,
            message: 'Registration completed but no username was generated'
          };
        }
      } else {
        console.error('Registration failed with status:', response.status);
        console.error('Registration error data:', responseData);
        
        return {
          success: false,
          message: responseData.message || 'Registration failed. Please try again.'
        };
      }
    } catch (error) {
      console.error('Registration network error:', error);
      return {
        success: false,
        message: 'Network error occurred during registration. Please try again.'
      };
    }
  };

  const signOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("stylocoin_user");
    localStorage.removeItem("stylocoin_keep_logged_in");
    localStorage.removeItem("stylocoin_token");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("stylocoin_user", JSON.stringify(updatedUser));
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

