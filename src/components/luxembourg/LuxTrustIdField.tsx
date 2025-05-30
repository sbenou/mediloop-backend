
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface LuxTrustIdFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const LuxTrustIdField: React.FC<LuxTrustIdFieldProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const maskedValue = value ? '•'.repeat(Math.max(8, value.length)) : '';

  return (
    <div className="space-y-2">
      <Label htmlFor="luxtrust-id">LuxTrust ID</Label>
      <div className="relative">
        <Input
          id="luxtrust-id"
          type={isVisible ? 'text' : 'password'}
          value={isVisible ? value : maskedValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your LuxTrust ID"
          disabled={disabled}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={toggleVisibility}
          disabled={disabled}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Your LuxTrust ID is encrypted and securely stored.
      </p>
    </div>
  );
};

export default LuxTrustIdField;
