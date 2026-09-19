const SUPABASE_URL = "https://vtznzbzarzjjruhbquce.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0buqcyB763Nj8-tGV2Uaag_a8AnG6Z4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Keep the Employee Portal synchronized when Admin assigns or updates tasks.
// The employee page reloads only when a task row changes; no task data is exposed here.
if (window.location.pathname.includes('/employee/')) {
  supabaseClient
    .channel('employee-task-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      window.location.reload();
    })
    .subscribe();
}

// The Admin page must never remain signed in as an employee/customer.
// If an existing non-admin session opens /admin/, clear that session and reload
// so the user gets the Admin sign-in form instead of the "Admin access required" page.
if (window.location.pathname.includes('/admin/')) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (!session) return;
    setTimeout(async () => {
      const { data: role } = await supabaseClient.rpc('get_my_role');
      if (role !== 'admin') {
        await supabaseClient.auth.signOut();
        window.location.reload();
      }
    }, 0);
  });
}
