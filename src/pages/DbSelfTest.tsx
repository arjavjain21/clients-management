import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendAssignmentEmail } from '@/lib/email';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function DbSelfTest() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarState();
  const [emailTest, setEmailTest] = useState({ enabled: false, email: '', sending: false });
  const [updateTest, setUpdateTest] = useState({ running: false, result: null as any });

  // Environment checks
  const envChecks = [
    { name: 'SUPABASE_URL', value: !!import.meta.env.VITE_SUPABASE_URL, required: true },
    { name: 'SUPABASE_ANON_KEY', value: !!import.meta.env.VITE_SUPABASE_ANON_KEY, required: true },
    { name: 'RESEND_API_KEY (edge function)', value: 'Unknown', required: false },
    { name: 'EMAIL_FROM (edge function)', value: 'Unknown', required: false },
  ];

  // Auth session check
  const { data: session } = useQuery({
    queryKey: ['session-check'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  // SELECT test
  const { data: selectTest, isLoading: selectLoading, error: selectError } = useQuery({
    queryKey: ['select-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('client_code, client_id, client_name')
        .limit(1);
      if (error) throw error;
      return data;
    },
  });

  // UPDATE test function
  const runUpdateTest = async () => {
    setUpdateTest({ running: true, result: null });
    try {
      // Get first client
      const { data: clients, error: selectError } = await supabase
        .from('clients')
        .select('client_code, client_id, client_company_name')
        .limit(1);
      
      if (selectError) throw selectError;
      if (!clients || clients.length === 0) throw new Error('No clients found for update test');

      const client = clients[0];
      const originalName = client.client_company_name;

      // Perform idempotent update (set to same value)
      const { error: updateError } = await supabase
        .from('clients')
        .update({ client_company_name: originalName })
        .eq('client_code', client.client_code)
        .eq('client_id', client.client_id);

      if (updateError) throw updateError;

      setUpdateTest({ running: false, result: { success: true, client: `${client.client_code}-${client.client_id}` } });
    } catch (error: any) {
      setUpdateTest({ running: false, result: { success: false, error: error.message } });
    }
  };

  // Email test function
  const runEmailTest = async () => {
    if (!emailTest.email) {
      toast({ variant: 'destructive', title: 'Email required', description: 'Please enter test email address' });
      return;
    }

    setEmailTest(prev => ({ ...prev, sending: true }));
    try {
      await sendAssignmentEmail({
        to: emailTest.email,
        subject: 'Self-test email from Clients Admin',
        text: 'This is a test email from the Clients Admin self-test page. If you received this, email functionality is working correctly.',
      });
      toast({ title: 'Email sent', description: 'Test email sent successfully' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Email failed', description: error.message });
    } finally {
      setEmailTest(prev => ({ ...prev, sending: false }));
    }
  };

  const StatusIcon = ({ success }: { success: boolean | null }) => {
    if (success === null) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    return success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  };

  const allPassed = envChecks.filter(c => c.required).every(c => c.value) && 
                   selectTest && 
                   updateTest.result?.success;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <div className={cn(
        "transition-all duration-200 ease-in-out",
        collapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Database Self-Test</h1>
            {allPassed && (
              <Badge variant="default" className="bg-green-600 text-white">
                All Tests Passed ✅
              </Badge>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {envChecks.map((check) => (
                  <div key={check.name} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{check.name}</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={check.value === true ? true : check.value === false ? false : null} />
                      {check.required && !check.value && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Session Status</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon success={null} />
                    <span className="text-sm">
                      {session ? `User: ${session.user.email}` : 'Not signed in'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database SELECT */}
            <Card>
              <CardHeader>
                <CardTitle>Database SELECT Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Read clients table</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon success={selectLoading ? null : (selectError ? false : !!selectTest)} />
                    <span className="text-sm">
                      {selectLoading ? 'Testing...' : 
                       selectError ? `Error: ${selectError.message}` : 
                       selectTest ? `Found ${selectTest.length} client(s)` : 'No data'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database UPDATE */}
            <Card>
              <CardHeader>
                <CardTitle>Database UPDATE Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Write to clients table</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon success={updateTest.result ? updateTest.result.success : null} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={runUpdateTest}
                      disabled={updateTest.running}
                    >
                      {updateTest.running ? 'Testing...' : 'Run Test'}
                    </Button>
                  </div>
                </div>
                {updateTest.result && (
                  <div className="text-xs text-muted-foreground">
                    {updateTest.result.success 
                      ? `Successfully updated client ${updateTest.result.client}` 
                      : `Error: ${updateTest.result.error}`}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Test */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Email Delivery Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="test-email">Test Email Address:</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={emailTest.email}
                    onChange={(e) => setEmailTest(prev => ({ ...prev, email: e.target.value }))}
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    onClick={runEmailTest}
                    disabled={emailTest.sending || !emailTest.email}
                  >
                    {emailTest.sending ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email delivery depends on RESEND_API_KEY and EMAIL_FROM being configured in the Supabase edge function.
                </p>
              </CardContent>
            </Card>
          </div>

          {allPassed && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="text-center text-green-800">
                  <h3 className="text-lg font-semibold mb-2">🎉 All Core Tests Passed!</h3>
                  <p>Your Clients Admin system is properly configured and operational.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}