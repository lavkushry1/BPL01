import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * Unauthorized page shown when a user tries to access a route they don't have permission for
 */
const Unauthorized = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goBack = () => navigate(-1);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">
            {t('errors.unauthorized')}
          </h1>
          
          <p className="text-gray-600 mb-8">
            {t('errors.noPermission')}
          </p>
          
          <div className="flex justify-center">
            <Button onClick={goBack}>
              {t('common.goBack')}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Unauthorized; 