import toast from "react-hot-toast";

export const blockAdminAction = () => {
  if (typeof window !== "undefined") {
    if (localStorage.getItem("admin_user_view_mode") === "true") {
      toast.error("Action denied: Admins can only view the website and cannot perform user operations.");
      return true;
    }
  }
  return false;
};
