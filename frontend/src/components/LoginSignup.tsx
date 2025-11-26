import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Plane } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner@2.0.3';

type LoginForm = {
    email: string;
    password: string;
};

type SignupForm = {
    name?: string;
    email: string;
    password: string;
};

export function LoginSignup() {
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const { register: regLogin, handleSubmit: handleLoginSubmit } = useForm<LoginForm>();
    const { register: regSignup, handleSubmit: handleSignupSubmit } = useForm<SignupForm>();
    const [loading, setLoading] = useState(false);

    const onLogin = async (data: LoginForm) => {
        setLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const onSignup = async (data: SignupForm) => {
        setLoading(true);
        try {
            await signup(data.email, data.password);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center mb-8">
                    <Plane className="h-10 w-10 text-blue-600 mr-3" />
                    <h1 className="text-3xl text-gray-900">TripCircle</h1>
                </div>

                <div className="w-full">
                    <div className="mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Login</CardTitle>
                                <CardDescription>Login to access your travel plans</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleLoginSubmit(onLogin)}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input id="login-email" type="email" placeholder="you@example.com" {...regLogin('email', { required: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Input id="login-password" type="password" placeholder="••••••••" {...regLogin('password', { required: true })} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? 'Logging in...' : 'Login'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Account</CardTitle>
                                <CardDescription>Start planning your adventures</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignupSubmit(onSignup)}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">Name</Label>
                                        <Input id="signup-name" type="text" placeholder="John Doe" {...regSignup('name')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <Input id="signup-email" type="email" placeholder="you@example.com" {...regSignup('email', { required: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <Input id="signup-password" type="password" placeholder="••••••••" {...regSignup('password', { required: true, minLength: 6 })} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? 'Creating account...' : 'Sign Up'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-600 mt-4">Demo mode: Data stored locally in browser</p>
            </div>
        </div>
    );
}
