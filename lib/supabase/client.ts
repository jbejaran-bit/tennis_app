"use client";

// Mock Supabase client for client-side authentication
export function createClient() {
  return {
    auth: {
      async getUser() {
        if (typeof window === "undefined") return { data: { user: null }, error: null };
        const session = localStorage.getItem("baseline_session");
        if (session) {
          try {
            const user = JSON.parse(session);
            return { data: { user }, error: null };
          } catch (e) {
            return { data: { user: null }, error: null };
          }
        }
        return { data: { user: null }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (typeof window === "undefined") return { error: null };
        const mockUser = {
          id: "mock-user-id",
          email,
          user_metadata: { full_name: email.split("@")[0] }
        };
        localStorage.setItem("baseline_session", JSON.stringify(mockUser));
        return { data: { user: mockUser }, error: null };
      },
      async signUp({ email, password, options }: any) {
        if (typeof window === "undefined") return { error: null };
        const name = options?.data?.full_name || email.split("@")[0];
        const mockUser = {
          id: "mock-user-id",
          email,
          user_metadata: { full_name: name }
        };
        localStorage.setItem("baseline_session", JSON.stringify(mockUser));
        return { data: { user: mockUser }, error: null };
      },
      async signInWithOAuth({ provider, options }) {
        if (typeof window === "undefined") return { error: null };
        const mockUser = {
          id: "mock-google-user-id",
          email: "tennis.pro@gmail.com",
          user_metadata: { full_name: "Tennis Pro" }
        };
        localStorage.setItem("baseline_session", JSON.stringify(mockUser));
        if (options?.redirectTo) {
          window.location.href = options.redirectTo;
        }
        return { data: { user: mockUser }, error: null };
      },
      async signOut() {
        if (typeof window === "undefined") return { error: null };
        localStorage.removeItem("baseline_session");
        return { error: null };
      }
    }
  };
}
