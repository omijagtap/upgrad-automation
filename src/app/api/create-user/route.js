import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase URL or Service Key is not configured on the server.' },
        { status: 500 }
      );
    }

    // Initialize the Admin Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Create the authenticated user and confirm the email instantly!
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Bypasses email confirmation completely!
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData?.user;
    if (!user) {
      return NextResponse.json({ error: 'Failed to retrieve the created user.' }, { status: 500 });
    }

    // 2. Upsert the user's profile record in the "profiles" table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        name: name,
        email: email,
        role: role || 'user',
        active: true,
        current_password: password
      });

    if (profileError) {
      // Clean up the newly created auth user if profile insertion fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 400 }
      );
    }

    // 3. Try to add to password history table (fails gracefully if table is not created yet)
    try {
      await supabaseAdmin
        .from('password_history')
        .insert({
          profile_id: user.id,
          user_email: email,
          password: password,
          changed_by: 'admin'
        });
    } catch (err) {
      console.error('Failed to log initial password to password_history:', err);
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Server error in create-user route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
