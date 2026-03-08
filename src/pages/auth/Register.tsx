import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IdCardUpload } from '@/components/IdCardUpload';

const COLLEGE_OPTIONS = [
  'Acharya Narendra Dev College, University of Delhi',
  'Other',
];

const currentYear = new Date().getFullYear();
const ADMISSION_YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState(COLLEGE_OPTIONS[0]);
  const [otherCollege, setOtherCollege] = useState('');
  const [course, setCourse] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [admissionYear, setAdmissionYear] = useState<number>(currentYear);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const finalCollege = college === 'Other' ? otherCollege.trim() : college;
    if (!finalCollege) {
      toast.error('Please specify your college');
      return;
    }
    if (!course.trim()) {
      toast.error('Please enter your course');
      return;
    }
    if (!rollNo.trim()) {
      toast.error('Please enter your roll number');
      return;
    }
    if (!idCardFile) {
      toast.error('Please upload your college ID card');
      return;
    }

    setLoading(true);

    // Upload ID card first
    // Use email as temp identifier since we don't have user id yet
    const fileExt = idCardFile.name.split('.').pop();
    const tempPath = `signup/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('id-cards')
      .upload(tempPath, idCardFile, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      toast.error('Failed to upload ID card: ' + uploadError.message);
      setLoading(false);
      return;
    }

    const { error } = await signUp(
      email, password, fullName, finalCollege, course.trim(),
      rollNo.trim(), admissionYear, tempPath
    );

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Registration successful! Please check your email to verify your account.');
    navigate(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
  };

  const inputClass =
    'w-full px-4 py-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff] transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-[#1c1c1c] border border-[#d3d3d3] rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Create Account</h1>
            <p className="text-gray-400 mt-2">Join us and start exploring</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} placeholder="John Doe" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="college" className="block text-sm font-medium text-gray-300 mb-2">College</label>
              <select id="college" value={college} onChange={(e) => setCollege(e.target.value)} className={`${inputClass} appearance-none`}>
                {COLLEGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {college === 'Other' && (
                <input type="text" value={otherCollege} onChange={(e) => setOtherCollege(e.target.value)} required className={`${inputClass} mt-2`} placeholder="Enter your college name" />
              )}
            </div>

            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-300 mb-2">Course</label>
              <input id="course" type="text" value={course} onChange={(e) => setCourse(e.target.value)} required className={inputClass} placeholder="e.g. B.Sc (H) Computer Science" />
            </div>

            <div>
              <label htmlFor="rollNo" className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
              <input id="rollNo" type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} required className={inputClass} placeholder="e.g. 2301234" />
            </div>

            <div>
              <label htmlFor="admissionYear" className="block text-sm font-medium text-gray-300 mb-2">Year of Admission</label>
              <select id="admissionYear" value={admissionYear} onChange={(e) => setAdmissionYear(Number(e.target.value))} className={`${inputClass} appearance-none`}>
                {ADMISSION_YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">College ID Card</label>
              <IdCardUpload file={idCardFile} preview={idCardPreview} onFileChange={(f, p) => { setIdCardFile(f); setIdCardPreview(p); }} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} placeholder="••••••••" />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={inputClass} placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-[#9113ff] hover:bg-[#7c0fd9] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'} className="text-[#9113ff] hover:text-[#a855f7] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
