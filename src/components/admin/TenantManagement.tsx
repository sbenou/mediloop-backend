
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tenant } from '@/utils/tenancy';

interface TenantFormData {
  name: string;
  domain: string;
}

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<TenantFormData>({ name: '', domain: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { hasPermission, userRole } = useAuth();
  const { toast } = useToast();

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTenants(
        data.map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain,
          schema: tenant.schema,
          isActive: tenant.is_active,
          status: tenant.status,
          createdAt: tenant.created_at
        }))
      );
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Call the server function to create the tenant schema
      const { data, error } = await supabase.rpc('create_tenant_schema', {
        tenant_name: formData.name,
        tenant_domain: formData.domain
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Tenant "${formData.name}" has been created`,
      });

      setFormData({ name: '', domain: '' });
      setOpen(false);
      fetchTenants();
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tenant',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      const newStatus = !tenant.isActive;
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: newStatus })
        .eq('id', tenant.id);

      if (error) throw error;

      setTenants(
        tenants.map((t) =>
          t.id === tenant.id ? { ...t, isActive: newStatus } : t
        )
      );

      toast({
        title: 'Success',
        description: `Tenant "${tenant.name}" has been ${newStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling tenant status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tenant status',
        variant: 'destructive',
      });
    }
  };

  // Only superadmins can manage tenants
  if (userRole !== 'superadmin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tenant Management</CardTitle>
          <CardDescription>
            You do not have permission to manage tenants.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tenant Management</CardTitle>
          <CardDescription>
            Create and manage tenants for your application.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>
                  Create a new tenant with its own database schema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name</Label>
                  <Input
                    id="name"
                    placeholder="Hospital ABC"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">
                    Domain (subdomain for tenant.mediloop.com)
                  </Label>
                  <Input
                    id="domain"
                    placeholder="hospital-abc"
                    value={formData.domain}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        domain: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will create {formData.domain || 'subdomain'}.mediloop.com
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.domain}
                >
                  {isSubmitting ? 'Creating...' : 'Create Tenant'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Schema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading tenants...
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No tenants found. Create your first tenant to get started.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>
                    <a
                      href={`http://${tenant.domain}.mediloop.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {tenant.domain}.mediloop.com
                    </a>
                  </TableCell>
                  <TableCell>{tenant.schema}</TableCell>
                  <TableCell>
                    <Badge
                      variant={tenant.isActive ? 'default' : 'secondary'}
                    >
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={tenant.isActive ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggleStatus(tenant)}
                    >
                      {tenant.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default TenantManagement;
