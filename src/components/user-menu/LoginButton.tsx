
import { useNavigate } from "react-router-dom";

const LoginButton = () => {
  const navigate = useNavigate();
  
  const handleNavigateToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <button
      onClick={handleNavigateToLogin}
      className="text-primary hover:text-primary/80 transition-colors"
    >
      Connection
    </button>
  );
};

export default LoginButton;
