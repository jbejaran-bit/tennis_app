// Mock Supabase client for Next.js Server Components (Node.js environment)
export function createClient() {
  return {
    auth: {
      async getUser() {
        // Return null by default to render the landing page cleanly
        return {
          data: { user: null },
          error: null
        };
      }
    }
  };
}
