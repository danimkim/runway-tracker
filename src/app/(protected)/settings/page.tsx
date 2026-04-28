import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/(protected)/settings/actions';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="screen has-bottom-nav">
      <div className="px-5 py-6">
        <h1 className="text-[22px] font-bold text-primary mb-2">Settings</h1>
        <p className="text-sm text-secondary mb-8">{user?.email}</p>
        <form action={logout}>
          <button type="submit" className="btn-primary">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
