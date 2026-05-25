import React from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess, onError, disabled }) => {
  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      onError('Google did not return a credential. Try again.');
      return;
    }
    onSuccess(response.credential);
  };

  return (
    <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError('Google sign-in was cancelled or failed')}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="320"
      />
    </div>
  );
};

export default GoogleSignInButton;
