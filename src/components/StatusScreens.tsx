import { useAuth } from '../auth/AuthProvider';

export function ConfigNotice() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Setup needed</div>
        <div className="auth-subtitle">
          This deployment isn't connected to a database yet. Set{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the
          site's environment variables, then redeploy. See the project README for the full
          setup steps.
        </div>
      </div>
    </div>
  );
}

export function PendingApproval() {
  const { profile, signOut } = useAuth();
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Awaiting approval</div>
        <div className="auth-subtitle">
          Your account ({profile?.email}) has been created but hasn't been assigned a role or
          campus yet. Ask a school admin to approve you from Admin → Staff.
        </div>
        <button className="btn-primary" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
