import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: 'super_admin' | 'client';
}

interface UpdateUserRequest {
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'super_admin' | 'client';
  password?: string;
}

interface DeleteUserRequest {
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request comes from an authenticated super admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Check if user is super admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (!userRole) {
      throw new Error('Insufficient permissions');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'create': {
        const body: CreateUserRequest = await req.json();
        
        // Create user in auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          user_metadata: {
            first_name: body.first_name,
            last_name: body.last_name,
          },
          email_confirm: true
        });

        if (authError) {
          console.error('Auth error:', authError);
          return new Response(JSON.stringify({ 
            error: authError.message || 'Failed to create user in auth system'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: authUser.user.id,
            first_name: body.first_name || null,
            last_name: body.last_name || null,
            role: body.role
          });

        if (profileError) {
          console.error('Profile error:', profileError);
          return new Response(JSON.stringify({ 
            error: 'User created but failed to create profile: ' + profileError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Add role to user_roles table
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: body.role
          });

        if (roleError) {
          console.error('Role error:', roleError);
          return new Response(JSON.stringify({ 
            error: 'User created but failed to assign role: ' + roleError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, user: authUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const body: UpdateUserRequest = await req.json();
        
        // Update auth user if email or password changed
        const authUpdates: any = {};
        if (body.email) authUpdates.email = body.email;
        if (body.password) authUpdates.password = body.password;
        
        if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            body.user_id,
            authUpdates
          );
          if (authError) throw authError;
        }

        // Update profile
        const profileUpdates: any = {};
        if (body.first_name !== undefined) profileUpdates.first_name = body.first_name;
        if (body.last_name !== undefined) profileUpdates.last_name = body.last_name;
        if (body.role !== undefined) profileUpdates.role = body.role;

        if (Object.keys(profileUpdates).length > 0) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(profileUpdates)
            .eq('user_id', body.user_id);

          if (profileError) throw profileError;
        }

        // Update role in user_roles table if needed
        if (body.role) {
          // Delete existing roles
          await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', body.user_id);

          // Insert new role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: body.user_id,
              role: body.role
            });

          if (roleError) throw roleError;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const body: DeleteUserRequest = await req.json();
        
        // Delete user from auth (cascades to profiles and user_roles)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(body.user_id);
        
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        // Get all users with their profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get user emails from auth
        const usersWithEmails = [];
        
        for (const profile of profiles || []) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          
          if (authUser.user) {
            usersWithEmails.push({
              ...profile,
              email: authUser.user.email || 'Unknown'
            });
          }
        }

        return new Response(JSON.stringify({ users: usersWithEmails }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in manage-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);