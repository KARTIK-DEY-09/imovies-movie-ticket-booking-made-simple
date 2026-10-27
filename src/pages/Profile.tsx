import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Lock, Shield, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMsg(null);
      await updateProfile({ username, phone, avatar });
      setProfileMsg({ text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'Failed to update profile.', error: true });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', error: true });
      return;
    }
    try {
      setSavingPassword(true);
      setPasswordMsg(null);
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Failed to change password.', error: true });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-black text-white font-['Outfit']">My Account & Settings</h1>
          <p className="text-xs text-slate-400">Manage your credentials, phone, and security options</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: User Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={user?.username}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-rose-500 shadow-xl"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">{user?.username}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="mt-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {user?.role} Account
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-left text-xs text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Member Since:</span>
                  <span className="text-slate-200">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Saved in Watchlist:</span>
                  <span className="text-rose-400 font-bold">{user?.watchlist?.length || 0} movies</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Forms (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Edit Profile Info Form */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-rose-500" />
                <span>Personal Information</span>
              </h3>

              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMsg.error
                      ? 'bg-rose-950/60 border border-rose-900 text-rose-300'
                      : 'bg-emerald-950/60 border border-emerald-900 text-emerald-300'
                  }`}
                >
                  {profileMsg.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-950 border border-slate-800/60 rounded-xl p-2.5 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                <span>Change Password</span>
              </h3>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMsg.error
                      ? 'bg-rose-950/60 border border-rose-900 text-rose-300'
                      : 'bg-emerald-950/60 border border-emerald-900 text-emerald-300'
                  }`}
                >
                  {passwordMsg.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-rose-500" />
                  <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
