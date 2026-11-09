import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { visitApi } from "../../services/visitApi";

/** Counts one website visit per browser session (guests included, admins skipped). Renders nothing. */
export default function VisitTracker() {
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (isLoading || isAdmin) return;
    visitApi.recordOnce(user?.nodeId);
  }, [isLoading, isAdmin, user?.nodeId]);

  return null;
}
