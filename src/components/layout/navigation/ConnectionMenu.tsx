
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const ConnectionMenu = () => {
  const { t } = useTranslation();
  
  return (
    <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">
      Connection
    </Link>
  );
};

export default ConnectionMenu;
