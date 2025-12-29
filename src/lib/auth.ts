import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            authorize: async (credentials) => {
                // Simple hardcoded authentication
                const username = credentials?.username as string;
                const password = credentials?.password as string;

                if (username === 'admin' && password === 'password123') {
                    return {
                        id: '1',
                        name: 'Admin',
                        email: 'admin@epc-dashboard.com',
                        role: 'admin',
                    };
                }

                return null;
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth;
        },
        jwt: async ({ token, user }) => {
            if (user) {
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        session: async ({ session, token }) => {
            if (session.user) {
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.AUTH_SECRET || 'epc-dashboard-secret-key-2024',
});
