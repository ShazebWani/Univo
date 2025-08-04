import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, X } from 'lucide-react';

export default function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setMessage('');
      await resendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
      console.error('Resend verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show if user is logged in, email is not verified, and not dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 relative">
      <Mail className="h-4 w-4" />
      <AlertDescription className="pr-8">
        <div className="flex items-center justify-between">
          <span>Please verify your email address to access all features.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Email'}
          </Button>
        </div>
        {message && (
          <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {message}
          </div>
        )}
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  );
} 