import express, { Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterPayload, LoginPayload, StoredUser, UserProfile, DbStatusResponse } from '../types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'secure_development_jwt_secret_key_2026';
const BCRYPT_SALT_ROUNDS = 10;

// PostgreSQL / Supabase Schema definition for reference & 1-click execution
export const SUPABASE_SCHEMA_SQL = `-- Run this in your Supabase SQL Editor to create the users table:
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  skills JSONB DEFAULT '[]'::jsonb,
  domain_expertise TEXT NOT NULL,
  years_of_experience NUMERIC DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (best practice for Supabase)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow full access for backend service & anon clients
CREATE POLICY "Allow public insert and read" ON public.users
  FOR ALL USING (true) WITH CHECK (true);
`;

// In-memory fallback database for sandbox mode or when Supabase keys are not set
export const memoryDatabase: Map<string, StoredUser> = new Map();

// Seed initial sample user in sandbox so login is immediately testable
const initialPasswordHash = bcrypt.hashSync('DemoSecure123!', BCRYPT_SALT_ROUNDS);
const demoUser: StoredUser = {
  id: 'demo-user-1',
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  password_hash: initialPasswordHash,
  domain_expertise: 'Full-Stack Engineering',
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
  years_of_experience: 5,
  bio: 'Passionate full-stack developer with 5+ years of experience building modern web apps and scalable microservices.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
memoryDatabase.set(demoUser.email.toLowerCase(), demoUser);

// Lazy Supabase client resolver
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Error initializing Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

// Extract project reference from URL to construct direct dashboard link
export function getSupabaseSqlEditorUrl(url: string | null | undefined): string {
  if (!url) return 'https://supabase.com/dashboard';
  try {
    const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    if (match && match[1]) {
      return `https://supabase.com/dashboard/project/${match[1]}/sql/new`;
    }
  } catch (_) {
    // fallback
  }
  return 'https://supabase.com/dashboard';
}

// Check if Supabase connection & table are accessible
export async function testSupabaseConnection(): Promise<{ connected: boolean; tableExists: boolean; message: string }> {
  const client = getSupabaseClient();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

  if (!client || !url) {
    return {
      connected: false,
      tableExists: false,
      message: 'Supabase credentials not configured. Using in-memory sandbox storage.',
    };
  }

  try {
    const { data, error } = await client.from('users').select('id').limit(1);
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST200' ||
        error.message.includes('relation "users" does not exist') ||
        error.message.includes('schema cache') ||
        error.message.includes('does not exist') ||
        error.message.includes('Could not find the table')
      ) {
        return {
          connected: true,
          tableExists: false,
          message: 'Supabase project is connected! Table "public.users" has not been created yet in Postgres. Run the SQL schema in Supabase SQL editor.',
        };
      }
      return {
        connected: false,
        tableExists: false,
        message: `Supabase query error: ${error.message}`,
      };
    }
    return {
      connected: true,
      tableExists: true,
      message: 'Successfully connected to Supabase "users" table. Cloud PostgreSQL storage active.',
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: `Failed to connect to Supabase: ${err.message}`,
    };
  }
}

// Generate JWT token
export function generateToken(user: UserProfile): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token middleware
export function authenticateToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
      return;
    }
    (req as any).user = decodedUser;
    next();
  });
}

export function createApiRouter() {
  const router = express.Router();

  // Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'standalone-node',
      supabaseConfigured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    });
  });

  // Database Status & Diagnostics endpoint
  router.get('/db/status', async (req: Request, res: Response) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
    const testResult = await testSupabaseConnection();
    const sqlEditorUrl = getSupabaseSqlEditorUrl(supabaseUrl);

    let totalUsers = memoryDatabase.size;
    let activeStore: 'supabase' | 'sandbox' = 'sandbox';

    if (testResult.tableExists && testResult.connected) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { count, error } = await client.from('users').select('*', { count: 'exact', head: true });
          if (!error && count !== null) {
            totalUsers = count;
            activeStore = 'supabase';
          }
        } catch (_) {}
      }
    }

    const responseData: DbStatusResponse = {
      configured: Boolean(supabaseUrl),
      supabaseUrl,
      tableExists: testResult.tableExists,
      activeStore,
      totalUsers,
      message: testResult.message,
      schemaScript: SUPABASE_SCHEMA_SQL,
      sqlEditorUrl,
      directPgConfigured: false,
    };

    res.json(responseData);
  });

  // Check / Init table status
  router.post('/db/init-table', async (req: Request, res: Response) => {
    const testResult = await testSupabaseConnection();
    if (testResult.tableExists) {
      res.json({
        success: true,
        tableExists: true,
        message: 'Table "users" is active and ready in Supabase.',
      });
    } else {
      res.json({
        success: false,
        tableExists: false,
        message:
          'Table "users" does not exist yet. Please copy the SQL schema and paste it into the Supabase SQL Editor, then click Run.',
        sqlEditorUrl: getSupabaseSqlEditorUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        schemaScript: SUPABASE_SCHEMA_SQL,
      });
    }
  });

  // Registration endpoint
  router.post('/auth/register', async (req: Request, res: Response) => {
    try {
      const payload: RegisterPayload = req.body;
      const { name, email, password, domain_expertise, skills, years_of_experience, bio } = payload;

      // Validation
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Name is required.' });
        return;
      }
      if (!email || !email.trim() || !email.includes('@')) {
        res.status(400).json({ success: false, message: 'A valid email address is required.' });
        return;
      }
      if (!password || password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        return;
      }
      if (!domain_expertise || !domain_expertise.trim()) {
        res.status(400).json({ success: false, message: 'Domain expertise is required.' });
        return;
      }
      if (!Array.isArray(skills) || skills.length === 0) {
        res.status(400).json({ success: false, message: 'Please add at least one skill to your profile.' });
        return;
      }
      if (years_of_experience === undefined || years_of_experience === null || Number(years_of_experience) < 0) {
        res.status(400).json({ success: false, message: 'Valid years of experience is required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // PASSWORD ENCRYPTION:
      // We securely hash the password using bcrypt with 10 salt rounds before saving to database
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      const client = getSupabaseClient();
      let storageType: 'supabase' | 'sandbox' = 'sandbox';
      let tableMissing = false;
      let savedUser: StoredUser;

      if (client) {
        try {
          // Check if user already exists in Supabase
          const { data: existingUser, error: checkError } = await client
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (
            checkError &&
            (checkError.message.includes('relation "users" does not exist') ||
              checkError.message.includes('schema cache') ||
              checkError.message.includes('Could not find the table'))
          ) {
            tableMissing = true;
          } else if (existingUser) {
            res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
            return;
          }

          if (!tableMissing) {
            // Insert into Supabase
            const { data: insertedData, error: insertError } = await client
              .from('users')
              .insert({
                name: name.trim(),
                email: normalizedEmail,
                password_hash: passwordHash, // Encrypted password saved to Supabase
                skills: skills,
                domain_expertise: domain_expertise.trim(),
                years_of_experience: Number(years_of_experience),
                bio: bio?.trim() || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (insertError) {
              if (
                insertError.message.includes('schema cache') ||
                insertError.message.includes('does not exist') ||
                insertError.message.includes('relation "users"') ||
                insertError.message.includes('Could not find the table')
              ) {
                tableMissing = true;
              }
              console.warn('Supabase insert notice:', insertError.message);
            } else if (insertedData) {
              storageType = 'supabase';
              savedUser = {
                id: insertedData.id,
                name: insertedData.name,
                email: insertedData.email,
                password_hash: insertedData.password_hash,
                skills: Array.isArray(insertedData.skills) ? insertedData.skills : [],
                domain_expertise: insertedData.domain_expertise,
                years_of_experience: Number(insertedData.years_of_experience),
                bio: insertedData.bio,
                created_at: insertedData.created_at,
                updated_at: insertedData.updated_at,
              };
            }
          }
        } catch (dbErr: any) {
          console.warn('Supabase execution error:', dbErr.message);
        }
      }

      // If Supabase wasn't used or had an error / missing table, save in-memory store
      if (storageType === 'sandbox') {
        if (memoryDatabase.has(normalizedEmail)) {
          res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
          return;
        }

        const newId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        savedUser = {
          id: newId,
          name: name.trim(),
          email: normalizedEmail,
          password_hash: passwordHash, // Encrypted password in memory store
          skills: skills,
          domain_expertise: domain_expertise.trim(),
          years_of_experience: Number(years_of_experience),
          bio: bio?.trim() || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        memoryDatabase.set(normalizedEmail, savedUser);
      }

      const safeProfile: UserProfile = {
        id: savedUser!.id,
        name: savedUser!.name,
        email: savedUser!.email,
        domain_expertise: savedUser!.domain_expertise,
        skills: savedUser!.skills,
        years_of_experience: savedUser!.years_of_experience,
        bio: savedUser!.bio,
        created_at: savedUser!.created_at,
        updated_at: savedUser!.updated_at,
      };

      const token = generateToken(safeProfile);

      let responseMsg =
        storageType === 'supabase'
          ? 'Account successfully registered and saved to Supabase with Bcrypt password encryption.'
          : 'Account registered with Bcrypt encrypted password.';

      let warningMsg: string | undefined = undefined;
      if (tableMissing) {
        warningMsg =
          'Notice: Supabase project is connected, but the "users" table has not been created yet in your Supabase SQL editor. Please run the SQL schema in Supabase to persist users to the cloud.';
      }

      res.status(201).json({
        success: true,
        message: responseMsg,
        warning: warningMsg,
        tableMissing,
        token,
        user: safeProfile,
        storageType,
        passwordEncrypted: true,
      });
    } catch (err: any) {
      console.error('Registration server error:', err);
      res.status(500).json({ success: false, message: 'Internal server error during registration: ' + err.message });
    }
  });

  // Login endpoint
  router.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const payload: LoginPayload = req.body;
      const { email, password } = payload;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const client = getSupabaseClient();
      let matchedUser: StoredUser | null = null;
      let storageType: 'supabase' | 'sandbox' = 'sandbox';

      // 1. Check Supabase first if available
      if (client) {
        try {
          const { data: supaUser, error: supaError } = await client
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (!supaError && supaUser) {
            matchedUser = {
              id: supaUser.id,
              name: supaUser.name,
              email: supaUser.email,
              password_hash: supaUser.password_hash,
              skills: Array.isArray(supaUser.skills) ? supaUser.skills : [],
              domain_expertise: supaUser.domain_expertise,
              years_of_experience: Number(supaUser.years_of_experience),
              bio: supaUser.bio,
              created_at: supaUser.created_at,
              updated_at: supaUser.updated_at,
            };
            storageType = 'supabase';
          }
        } catch (dbErr) {
          console.warn('Supabase query error on login, falling back to memory store.');
        }
      }

      // 2. Fallback to memory store if not found in Supabase
      if (!matchedUser) {
        const memUser = memoryDatabase.get(normalizedEmail);
        if (memUser) {
          matchedUser = memUser;
          storageType = 'sandbox';
        }
      }

      if (!matchedUser) {
        res.status(401).json({ success: false, message: 'Invalid email address or password.' });
        return;
      }

      // PASSWORD VERIFICATION:
      // Compare entered plaintext password with stored bcrypt hash
      const isPasswordValid = await bcrypt.compare(password, matchedUser.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: 'Invalid email address or password.' });
        return;
      }

      const safeProfile: UserProfile = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        domain_expertise: matchedUser.domain_expertise,
        skills: matchedUser.skills,
        years_of_experience: matchedUser.years_of_experience,
        bio: matchedUser.bio,
        created_at: matchedUser.created_at,
        updated_at: matchedUser.updated_at,
      };

      const token = generateToken(safeProfile);

      res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: safeProfile,
        storageType,
        passwordEncrypted: true,
      });
    } catch (err: any) {
      console.error('Login server error:', err);
      res.status(500).json({ success: false, message: 'Internal server error during login: ' + err.message });
    }
  });

  // Get current user profile from token
  router.get('/auth/me', authenticateToken, async (req: Request, res: Response) => {
    try {
      const decodedUser = (req as any).user;
      const normalizedEmail = decodedUser.email.toLowerCase();
      const client = getSupabaseClient();

      if (client) {
        try {
          const { data: supaUser, error: supaError } = await client
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (!supaError && supaUser) {
            const safeProfile: UserProfile = {
              id: supaUser.id,
              name: supaUser.name,
              email: supaUser.email,
              domain_expertise: supaUser.domain_expertise,
              skills: Array.isArray(supaUser.skills) ? supaUser.skills : [],
              years_of_experience: Number(supaUser.years_of_experience),
              bio: supaUser.bio,
              created_at: supaUser.created_at,
              updated_at: supaUser.updated_at,
            };
            res.json({ success: true, user: safeProfile, storageType: 'supabase' });
            return;
          }
        } catch (_) {}
      }

      const memUser = memoryDatabase.get(normalizedEmail);
      if (memUser) {
        const safeProfile: UserProfile = {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          domain_expertise: memUser.domain_expertise,
          skills: memUser.skills,
          years_of_experience: memUser.years_of_experience,
          bio: memUser.bio,
          created_at: memUser.created_at,
          updated_at: memUser.updated_at,
        };
        res.json({ success: true, user: safeProfile, storageType: 'sandbox' });
        return;
      }

      res.status(404).json({ success: false, message: 'User profile not found.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch user session: ' + err.message });
    }
  });

  // Update profile endpoint
  router.put('/auth/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
      const decodedUser = (req as any).user;
      const normalizedEmail = decodedUser.email.toLowerCase();
      const { name, domain_expertise, skills, years_of_experience, bio } = req.body;

      const client = getSupabaseClient();
      let updatedUser: UserProfile | null = null;

      if (client) {
        try {
          const { data, error } = await client
            .from('users')
            .update({
              name,
              domain_expertise,
              skills,
              years_of_experience: Number(years_of_experience),
              bio: bio || '',
              updated_at: new Date().toISOString(),
            })
            .eq('email', normalizedEmail)
            .select()
            .single();

          if (!error && data) {
            updatedUser = {
              id: data.id,
              name: data.name,
              email: data.email,
              domain_expertise: data.domain_expertise,
              skills: Array.isArray(data.skills) ? data.skills : [],
              years_of_experience: Number(data.years_of_experience),
              bio: data.bio,
              created_at: data.created_at,
              updated_at: data.updated_at,
            };
          }
        } catch (_) {}
      }

      const memUser = memoryDatabase.get(normalizedEmail);
      if (memUser) {
        memUser.name = name || memUser.name;
        memUser.domain_expertise = domain_expertise || memUser.domain_expertise;
        memUser.skills = skills || memUser.skills;
        memUser.years_of_experience =
          years_of_experience !== undefined ? Number(years_of_experience) : memUser.years_of_experience;
        memUser.bio = bio !== undefined ? bio : memUser.bio;
        memUser.updated_at = new Date().toISOString();
        memoryDatabase.set(normalizedEmail, memUser);

        if (!updatedUser) {
          updatedUser = {
            id: memUser.id,
            name: memUser.name,
            email: memUser.email,
            domain_expertise: memUser.domain_expertise,
            skills: memUser.skills,
            years_of_experience: memUser.years_of_experience,
            bio: memUser.bio,
            created_at: memUser.created_at,
            updated_at: memUser.updated_at,
          };
        }
      }

      if (updatedUser) {
        res.json({ success: true, user: updatedUser, message: 'Profile updated successfully.' });
      } else {
        res.status(404).json({ success: false, message: 'User not found.' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Update failed: ' + err.message });
    }
  });

  // Directory of all users
  router.get('/users/all', async (req: Request, res: Response) => {
    try {
      const client = getSupabaseClient();
      let users: UserProfile[] = [];

      if (client) {
        try {
          const { data, error } = await client.from('users').select('*').order('created_at', { ascending: false });
          if (!error && data) {
            users = data.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              domain_expertise: u.domain_expertise,
              skills: Array.isArray(u.skills) ? u.skills : [],
              years_of_experience: Number(u.years_of_experience),
              bio: u.bio,
              created_at: u.created_at,
              updated_at: u.updated_at,
            }));
          }
        } catch (_) {}
      }

      // Also merge in-memory users if any exist that aren't in Supabase
      const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));
      for (const memUser of memoryDatabase.values()) {
        if (!existingEmails.has(memUser.email.toLowerCase())) {
          users.push({
            id: memUser.id,
            name: memUser.name,
            email: memUser.email,
            domain_expertise: memUser.domain_expertise,
            skills: memUser.skills,
            years_of_experience: memUser.years_of_experience,
            bio: memUser.bio,
            created_at: memUser.created_at,
            updated_at: memUser.updated_at,
          });
        }
      }

      res.json({ success: true, users, count: users.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to list users.' });
    }
  });

  return router;
}

export function createApp() {
  const app = express();
  app.use(express.json());

  // Mount API router at both '/api' and '/' so all rewrites resolve correctly
  const apiRouter = createApiRouter();
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  return app;
}
