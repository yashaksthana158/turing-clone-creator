import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-[#1c1c1c] border border-[#d3d3d3] rounded-lg p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium'] mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You don't have permission to access this page. Please contact an administrator if you believe this is a mistake.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="py-3 px-6 bg-[#9113ff] hover:bg-[#7c0fd9] text-white font-semibold rounded-lg transition-colors"
            >
              Go Home
            </Link>
            <Link
              to="/login"
              className="py-3 px-6 bg-transparent border border-[#9113ff] text-[#9113ff] hover:bg-[#9113ff]/10 font-semibold rounded-lg transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
