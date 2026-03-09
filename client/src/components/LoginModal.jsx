import { useState } from 'react';
import { login, register } from '../services/authService';

const LoginModal = ({ onClose, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let userCredential;
            if (isRegistering) {
                userCredential = await register(email, password);
            } else {
                userCredential = await login(email, password);
            }
            // onLogin is just a state callback in App, auth state listener will handle the actual session
            onClose();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak');
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-slide-up">

                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 md:left-auto md:right-4 z-50 p-2 md:p-2.5 rounded-xl bg-black/40 md:bg-white/5 hover:bg-black/60 md:hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10"
                >
                    <span className="hidden md:block">✕</span>
                    <span className="md:hidden text-xl font-bold">←</span>
                </button>

                <div className="p-8 border-b border-white/10">
                    <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-white/60 text-sm">
                        {isRegistering ? 'Start building your dream squad' : 'Sync your squad across devices'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-white/80 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-ef-accent focus:outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white/80 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-ef-accent focus:outline-none transition-all"
                            required
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full bg-gradient-to-r from-ef-accent to-ef-blue text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 hover:scale-[1.02]"
                    >
                        {isLoading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Login')}
                    </button>

                    <div className="pt-4 border-t border-white/10 text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-white/60 hover:text-ef-accent transition underline"
                        >
                            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
