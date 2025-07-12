
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Copy, ExternalLink, Trash2, Plus, RefreshCw } from 'lucide-react';
import { 
  Tenant, 
  DomainVerification, 
  initiateDomainVerification, 
  verifyDomainOwnership, 
  removeCustomDomain,
  fetchDomainVerifications 
} from '@/utils/tenancy';

interface CustomDomainManagerProps {
  tenant: Tenant;
  onDomainUpdated: () => void;
}

export function CustomDomainManager({ tenant, onDomainUpdated }: CustomDomainManagerProps) {
  const [customDomain, setCustomDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [verifications, setVerifications] = useState<DomainVerification[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tenant.id) {
      loadDomainVerifications();
    }
  }, [tenant.id]);

  const loadDomainVerifications = async () => {
    const data = await fetchDomainVerifications(tenant.id);
    setVerifications(data);
  };

  const handleInitiateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomain.trim()) return;

    try {
      setIsSubmitting(true);
      
      const result = await initiateDomainVerification(tenant.id, customDomain.trim());
      
      if (result) {
        setVerificationData(result);
        toast({
          title: 'Domain verification initiated',
          description: 'Please add the TXT record to your DNS settings.',
        });
        await loadDomainVerifications();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to initiate domain verification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error initiating verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate domain verification',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDomain = async (verificationId: string) => {
    try {
      setIsVerifying(true);
      
      const result = await verifyDomainOwnership(verificationId);
      
      if (result?.success) {
        toast({
          title: 'Domain verified successfully',
          description: `${result.domain} is now verified and active.`,
        });
        setOpen(false);
        setCustomDomain('');
        setVerificationData(null);
        await loadDomainVerifications();
        onDomainUpdated();
      } else {
        toast({
          title: 'Verification failed',
          description: result?.message || 'Please check your DNS settings and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify domain ownership',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    try {
      setIsRemoving(true);
      
      const success = await removeCustomDomain(tenant.id);
      
      if (success) {
        toast({
          title: 'Custom domain removed',
          description: 'The custom domain has been removed from this tenant.',
        });
        await loadDomainVerifications();
        onDomainUpdated();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove custom domain',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove custom domain',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The text has been copied to your clipboard.',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      verified: 'default',
      failed: 'destructive',
      expired: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Configure a custom domain for this tenant instead of using the default subdomain.
          </CardDescription>
        </div>
        {!tenant.customDomain && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleInitiateVerification}>
                <DialogHeader>
                  <DialogTitle>Add Custom Domain</DialogTitle>
                  <DialogDescription>
                    Enter the custom domain you want to use for this tenant.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      placeholder="example.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the domain without protocol (e.g., example.com, not https://example.com)
                    </p>
                  </div>
                  
                  {verificationData && (
                    <div className="space-y-2">
                      <Label>DNS Configuration Required</Label>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Add this TXT record to your DNS:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background p-1 rounded flex-1">
                            {verificationData.txt_record}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(verificationData.txt_record)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !customDomain.trim()}
                  >
                    {isSubmitting ? 'Initiating...' : 'Initiate Verification'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {tenant.customDomain ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tenant.customDomain}</span>
                  {getStatusBadge(tenant.domainVerified ? 'verified' : 'pending')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tenant.domainVerified 
                    ? 'Domain is verified and active' 
                    : 'Domain verification pending'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {tenant.domainVerified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://${tenant.customDomain}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Custom Domain</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove the custom domain "{tenant.customDomain}"? 
                        This will revert the tenant to using the default subdomain.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRemoveDomain}
                        disabled={isRemoving}
                      >
                        {isRemoving ? 'Removing...' : 'Remove Domain'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No custom domain configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Currently using: {tenant.domain}.mediloop.com
            </p>
          </div>
        )}

        {verifications.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Verification History</h4>
              <Button size="sm" variant="outline" onClick={loadDomainVerifications}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-2">
              {verifications.map((verification) => (
                <div key={verification.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{verification.domain}</span>
                      {getStatusBadge(verification.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(verification.createdAt).toLocaleString()}
                      {verification.attempts > 0 && ` • ${verification.attempts} attempts`}
                    </p>
                  </div>
                  {verification.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleVerifyDomain(verification.id)}
                      disabled={isVerifying}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomDomainManager;
