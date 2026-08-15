import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { PatientDashboard } from './components/patient-dashboard';
import { DoctorDashboard } from './components/doctor-dashboard';
import { PregnancyDashboard } from './components/pregnancy-dashboard';
import { PatientRecords } from './components/patient-records';
import { PrescriptionPad } from './components/prescription-pad';
import { SurveyResultsDoctor } from './components/survey-results-doctor';
import { AuthScreen } from './components/auth-screen';
import { WelcomeScreen } from './components/welcome-screen';
import { MedCoins } from './components/med-coins';
import { LanguageProvider, useLanguage } from './components/language-context';
import { LanguageSwitcher } from './components/language-switcher';
import { OfflineProvider } from './components/offline-context';
import { AuthProvider, useAuth } from './components/auth-context';
import { DemoProvider } from './components/demo-context';
import { SpeechRecognitionProvider } from './components/speech-recognition-context';
import { SafeSpeechProvider } from './components/safe-speech-wrapper';
import { VoiceStatus } from './components/voice-indicator';
import { AddMember, FamilyMember } from './components/add-member';
import { ErrorBoundary } from './components/error-boundary';
import { UserCheck, Globe, Wifi, WifiOff, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import patientIcon from '@/assets/01ec76020cd14434a23c1ff4857f1dbfbcc6ad1a.png';
import doctorIcon from '@/assets/50846eb64745974d321291b8a21b1450610141c3.png';
import newLogo from '@/assets/aa40833ff2e7677dd47ad2ece6ec0264a9ed8be6.png';
import { toast, Toaster } from 'sonner';
import { testConnectionWithSetup, supabase } from './utils/supabase/client';
import { checkAndSetupApp, SetupResult } from './utils/supabase/auto-setup';
import { checkDemoUserStatusWithTimeout, repairUserProfileWithTimeout } from './utils/api-helpers';

function AppContent() {
  const { t, language, setLanguage } = useLanguage();
  const { user, userProfile, loading, needsSetup, signOut, refreshProfile } = useAuth();
  const [selectedUserType, setSelectedUserType] = useState<'patient' | 'doctor' | 'pregnant' | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [selectedDemoProfile, setSelectedDemoProfile] = useState<'patient' | 'doctor' | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fromSignInWithAccount, setFromSignInWithAccount] = useState(false);
  const [showMedCoins, setShowMedCoins] = useState(false);
  const [medCoinsBalance, setMedCoinsBalance] = useState(150); 

  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    needsSetup: boolean;
    error: string | null;
  } | null>(null);
  const [demoUserStatus, setDemoUserStatus] = useState<{
    patient: boolean;
    doctor: boolean;
    checked: boolean;
  }>({ patient: false, doctor: false, checked: false });
  const [autoSetupStatus, setAutoSetupStatus] = useState<{
    running: boolean;
    completed: boolean;
    result?: SetupResult;
    timedOut?: boolean;
  }>({ running: false, completed: false });
  const [showWelcome, setShowWelcome] = useState(false);
  const [setupCheckRun, setSetupCheckRun] = useState(false);
  const setupInProgress = React.useRef(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset scroll position when views change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedUserType, showMemberSelection, selectedMember, showMedCoins]);

  
  React.useEffect(() => {
    const savedMembers = localStorage.getItem('familyMembers');
    if (savedMembers) {
      try {
        const parsed = JSON.parse(savedMembers);
        if (Array.isArray(parsed)) {
          setFamilyMembers(parsed);
        }
      } catch (error) {
        console.error('Error loading family members:', error);
        localStorage.removeItem('familyMembers'); 
      }
    }
  }, []);

  
  React.useEffect(() => {
    const checkSupabaseConnectionAndSetup = async () => {
      if (setupCheckRun || setupInProgress.current) return;
      
      setupInProgress.current = true;
      
      try {
        setSetupCheckRun(true);
        
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Setup timeout')), 15000)
        );
        
        const setupPromise = async () => {
          const status = await testConnectionWithSetup();
          setSupabaseStatus(status);
          
          if (status.connected && !status.needsSetup && !user) {
            setAutoSetupStatus({ running: true, completed: false });
            
            const setupResult = await checkAndSetupApp();
            setAutoSetupStatus({ 
              running: false, 
              completed: true, 
              result: setupResult 
            });
            
            if (setupResult.demoUsersCreated) {
              setDemoUserStatus({
                patient: true,
                doctor: true,
                checked: true
              });
            }
            
            if (setupResult.autoLoginSuccess) {
              setTimeout(() => setShowWelcome(true), 1000);
              toast.success('🎉 Welcome! Auto-setup completed and you\'re logged in as Demo Patient.');
            } else if (setupResult.demoUsersCreated && !setupResult.autoLoginSuccess) {
              toast.success('✅ Demo users created! You can now sign in.');
            }
          } else {
            setAutoSetupStatus({ running: false, completed: true });
          }
          
          
          try {
            const demoStatus = await checkDemoUserStatusWithTimeout(5000);
            setDemoUserStatus(demoStatus);
          } catch (error) {
            setDemoUserStatus({ patient: false, doctor: false, checked: true });
          }
        };
        
        await Promise.race([setupPromise(), timeoutPromise]);
        
      } catch (error: any) {
        console.warn('Setup timeout or error:', error.message);
        const isTimeout = error.message === 'Setup timeout';
        
        setSupabaseStatus({
          connected: false,
          needsSetup: true,
          error: isTimeout ? 'Setup timeout - continuing in offline mode' : 'Setup error - continuing in offline mode'
        });
        setAutoSetupStatus({ 
          running: false, 
          completed: true, 
          timedOut: isTimeout 
        });
        setDemoUserStatus({ patient: false, doctor: false, checked: true });
        
        if (isTimeout) {
          toast.info('Setup took too long - continuing with demo mode');
        } else {
          toast.info('Setup error - continuing with demo mode');
        }
      } finally {
        setupInProgress.current = false;
      }
    };

    if (!setupCheckRun) {
      
      const scheduleSetup = () => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => checkSupabaseConnectionAndSetup());
        } else {
          setTimeout(checkSupabaseConnectionAndSetup, 100);
        }
      };
      scheduleSetup();
    }
  }, [user, setupCheckRun]);

  const checkDemoUserStatus = async () => {
    try {
      const result = await checkDemoUserStatusWithTimeout(5000);
      setDemoUserStatus(result);
    } catch (error) {
      console.warn('Demo user status check failed:', error);
      setDemoUserStatus({ patient: false, doctor: false, checked: true });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSelectedUserType(null);
      setShowAuth(false);
      toast.success(t('signOutSuccessful'));
    } catch (error: any) {
      toast.error(error.message || 'Sign out failed');
    }
  };

  const handleUserTypeSelect = (userType: 'patient' | 'doctor' | 'pregnant') => {
    if (userType === 'patient') {
      // Patient: show family member selector first, don't set selectedUserType yet
      setDemoMode(true);
      setSelectedDemoProfile('patient');
      setShowMemberSelection(true);
      setSelectedUserType(null); // clear so dashboard doesn't fire
      toast.success('Select a family member to continue');
    } else if (userType === 'doctor') {
      setDemoMode(true);
      setSelectedDemoProfile('doctor');
      setSelectedUserType('doctor');
      toast.success('🎉 ' + (t('welcomeDemoDoctor') || 'Welcome, Demo Doctor!'));
    } else if (userType === 'pregnant') {
      // Pregnancy: go straight to pregnancy dashboard
      setDemoMode(true);
      setSelectedDemoProfile('patient');
      setSelectedUserType('pregnant');
      toast.success('🤰 Welcome to Pregnancy Care!');
    }
  };

  // No longer needed separately — merged into handleUserTypeSelect
  const handleDemoProfileSelect = (profileType: 'patient' | 'doctor') => {
    setDemoMode(true);
    setShowLogin(false);
    setSelectedDemoProfile(profileType);
    if (profileType === 'patient') {
      setShowMemberSelection(true);
    } else {
      setSelectedUserType(profileType);
    }
  };

  const handleMemberSelect = (memberType: 'me' | 'wife' | 'child' | 'add' | string) => {
    if (memberType === 'add') {
      setShowAddMember(true);
      return;
    }

    let member: FamilyMember | null = null;

    if (memberType === 'me') {
      member = {
        id: 'me',
        name: 'Arjun Sharma',
        gender: 'male',
        age: 45,
        relationship: 'self',
        emoji: '👨',
        bloodGroup: 'B+',
        showPregnancy: false
      };
    } else if (memberType === 'wife') {
      member = {
        id: 'wife',
        name: 'Priya Sharma',
        gender: 'female',
        age: 40,
        relationship: 'spouse',
        emoji: '👩',
        bloodGroup: 'A+',
        showPregnancy: true
      };
    } else if (memberType === 'child') {
      member = {
        id: 'child',
        name: 'Rohan Sharma',
        gender: 'male',
        age: 12,
        relationship: 'child',
        emoji: '👦',
        bloodGroup: 'O+',
        showPregnancy: false
      };
    } else {
      member = familyMembers.find(m => m.id === memberType) || null;
    }

    setSelectedMember(member);
    setShowMemberSelection(false);
    setSelectedUserType('patient');
  };

  const handleRemoveFamilyMember = (memberId: string) => {
    if (memberId === 'me' || memberId === 'wife' || memberId === 'child') {
      return;
    }
    
    const memberToRemove = familyMembers.find(m => m.id === memberId);
    if (!memberToRemove) return;
    
    const confirmed = window.confirm(
      t('confirmRemoveFamilyMember').replace('{name}', memberToRemove.name)
    );
    
    if (!confirmed) return;
    
    const updatedMembers = familyMembers.filter(m => m.id !== memberId);
    setFamilyMembers(updatedMembers);
    localStorage.setItem('familyMembers', JSON.stringify(updatedMembers));
    toast.success(`${memberToRemove.name} ${t('familyMemberRemoved')}`);
  };

  const handleMemberAdded = (newMember: FamilyMember) => {
    const updatedMembers = [...familyMembers, newMember];
    setFamilyMembers(updatedMembers);
    localStorage.setItem('familyMembers', JSON.stringify(updatedMembers));
    setShowAddMember(false);
    setShowMemberSelection(true);
    toast.success(`${newMember.name} ${t('familyMemberAdded')}`);
  };

  
  if (showMedCoins) {
    return (
      <MedCoins 
        onBack={() => setShowMedCoins(false)} 
      />
    );
  }

  
  if (loading || autoSetupStatus.running) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800 font-medium mb-2">
            {autoSetupStatus.running ? t('settingUpKutumbhCare') : t('loading')}
          </p>
          {autoSetupStatus.running && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>🔍 {t('checkingDatabase')}</p>
              <p>👥 {t('creatingDemoUsers')}</p>
              <p>🔐 {t('loggingYouIn')}</p>
              <div className="mt-4 text-xs text-blue-600">
                {t('onlyHappensOnce')}
              </div>
            </div>
          )}
          
          {}
          <div className="mt-8 space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                setAutoSetupStatus({ running: false, completed: true });
                toast.info('Setup skipped - you can still use demo mode');
              }}
              className="text-sm w-full"
            >
              Skip Setup & Continue
            </Button>
            <p className="text-xs text-gray-500">
              All features work in demo mode without setup
            </p>
          </div>
        </div>
      </div>
    );
  }

  
  if (showWelcome && user && userProfile) {
    return (
      <WelcomeScreen 
        onContinue={() => setShowWelcome(false)} 
      />
    );
  }

  
  if (user && userProfile) {
    const userType = userProfile.user_type;
    
    if (userType === 'patient') {
      return <PatientDashboard onBack={handleSignOut} selectedMember={selectedMember} />;
    }
    
    if (userType === 'doctor') {
      return <DoctorDashboard onBack={handleSignOut} />;
    }
  }

  
  if (demoMode && selectedUserType) {
    const handleDemoSignOut = () => {
      setSelectedUserType(null);
      setSelectedMember(null);
      
      if (selectedDemoProfile === 'patient') {
        // Back from patient dashboard → go to family member selection
        setShowMemberSelection(true);
      } else {
        // Back from doctor/pregnancy dashboard → go to home
        setDemoMode(false);
        setSelectedDemoProfile(null);
      }
    };
    
    if (selectedUserType === 'patient') {
      return (
        <DemoProvider userType="patient" isDemoMode={true}>
          <PatientDashboard onBack={handleDemoSignOut} selectedMember={selectedMember} />
        </DemoProvider>
      );
    }
    
    if (selectedUserType === 'doctor') {
      return (
        <DemoProvider userType="doctor" isDemoMode={true}>
          <DoctorDashboard onBack={handleDemoSignOut} />
        </DemoProvider>
      );
    }
    
    if (selectedUserType === 'pregnant') {
      return (
        <DemoProvider userType="pregnant" isDemoMode={true}>
          <PregnancyDashboard onBack={handleDemoSignOut} />
        </DemoProvider>
      );
    } 
  }

  
  if (user && needsSetup && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 flex items-center justify-center">
        {}
        <div className="fixed top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>
        
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center">
            <img 
              src={newLogo} 
              alt="Kutumbh Care Logo"
              className="w-28 h-28 object-contain"
            />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {t('databaseSetupRequired')}
          </h3>
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>{t('welcomeUserEmail').replace('{email}', user.email!)}</strong>
            </p>
            <p className="text-sm text-gray-600">
              {t('accountCreatedSuccessfully')}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={async () => {
                window.location.reload();
              }}
              className="w-full"
            >
              {t('setupDatabaseNow')}
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('signOutAndTryLater')}
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            💡 {t('databaseSetupOnlyOnce')}
          </div>
        </Card>
      </div>
    );
  }

  
  if (user && !userProfile && !needsSetup && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 flex items-center justify-center">
        {}
        <div className="fixed top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>
        
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center">
            <img 
              src={newLogo} 
              alt="Kutumbh Care Logo"
              className="w-28 h-28 object-contain"
            />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {t('profileSetupIssue')}
          </h3>
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>{t('accountLabel').replace('{email}', user.email!)}</strong>
            </p>
            <p className="text-sm text-gray-600">
              {t('profileLoadingIssue')}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={async () => {
                try {
                  await refreshProfile();
                  toast.success(t('profileRefreshedSuccessfully'));
                } catch (error: any) {
                  toast.error(t('profileRefreshFailed') + ' ' + error.message);
                }
              }}
              variant="outline"
              className="w-full"
            >
              🔄 {t('refreshProfile')}
            </Button>
            <Button
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('signOutAndTryAgain')}
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            💡 {t('persistsContactSupport')}
          </div>
        </Card>
      </div>
    );
  }

  
  if (showAddMember && demoMode && selectedDemoProfile === 'patient') {
    return (
      <AddMember 
        onBack={() => {
          setShowAddMember(false);
          setShowMemberSelection(true);
        }}
        onMemberAdded={handleMemberAdded}
      />
    );
  }

  
  if (showMemberSelection && demoMode && selectedDemoProfile === 'patient') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
          <button
            onClick={() => {
              setShowMemberSelection(false);
              setDemoMode(false);
              setSelectedDemoProfile(null);
              setSelectedUserType(null);
            }}
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            ← Back to Home
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={newLogo} alt="Kutumbh Care" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 18, color: '#15803d' }}>Kutumbh Care</span>
          </div>
          <LanguageSwitcher />
        </header>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, color: '#111827', marginBottom: 12 }}>Who needs care today?</h2>
            <p style={{ color: '#6b7280', fontSize: 16 }}>Select a family member to view their personalised health dashboard.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>

            {/* Me */}
            <button onClick={() => handleMemberSelect('me')}
              style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: '28px 20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#22c55e'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 52, marginBottom: 12 }}>👨</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', marginBottom: 4 }}>Arjun Sharma</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Self · 45 yrs · B+</div>
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#15803d', fontWeight: 600 }}>✓ Enter Dashboard</div>
            </button>

            {/* Wife */}
            <button onClick={() => handleMemberSelect('wife')}
              style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: '28px 20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ec4899'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 52, marginBottom: 12 }}>👩</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', marginBottom: 4 }}>Priya Sharma</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Spouse · 40 yrs · A+</div>
              <div style={{ background: '#fdf2f8', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#be185d', fontWeight: 600 }}>✓ Enter Dashboard</div>
            </button>

            {/* Child */}
            <button onClick={() => handleMemberSelect('child')}
              style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: '28px 20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 52, marginBottom: 12 }}>👦</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', marginBottom: 4 }}>Rohan Sharma</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Child · 12 yrs · O+</div>
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>✓ Enter Dashboard</div>
            </button>

            {/* Add custom family members */}
            {familyMembers.map((member) => (
              <button key={member.id} onClick={() => handleMemberSelect(member.id)}
                style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: '28px 20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', position: 'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#8b5cf6'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
              >
                <button
                  onClick={e => { e.stopPropagation(); handleRemoveFamilyMember(member.id); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: '#fef2f2', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{member.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', marginBottom: 4 }}>{member.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{member.age} yrs</div>
                <div style={{ background: '#faf5ff', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>✓ Enter Dashboard</div>
              </button>
            ))}

            {/* Add Member */}
            <button onClick={() => handleMemberSelect('add')}
              style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: 20, padding: '28px 20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6b7280'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 52, marginBottom: 12, color: '#9ca3af' }}>+</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#374151', marginBottom: 4 }}>Add Member</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Register a family member</div>
            </button>

          </div>
        </div>
      </div>
    );
  }



  // ─── MAIN LANDING PAGE ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 50%, #faf5ff 100%)' }}>

      {/* ── Top Bar ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', position: 'sticky', top: 0, backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(0,0,0,0.06)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={newLogo} alt="Kutumbh Care" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#15803d', letterSpacing: '-0.5px' }}>Kutumbh Care</div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>AI-Powered Predictive Health</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isOnline ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isOnline ? '#bbf7d0' : '#fecaca'}`, borderRadius: 20, padding: '4px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#22c55e' : '#ef4444' }} />
            <span style={{ fontSize: 12, color: isOnline ? '#15803d' : '#dc2626', fontWeight: 600 }}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section style={{ textAlign: 'center', padding: '72px 24px 48px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: 24, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
          <span>🏆</span> STAMPERS NATIONAL HACKATHON 2K26 — TRACK 3
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#111827', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20 }}>
          Predict Health Risks
          <span style={{ color: '#15803d' }}> Before</span> They Happen
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#4b5563', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.7 }}>
          Kutumbh Care uses time-series AI and anomaly detection to identify early warning signs — connecting families with doctors before a crisis occurs.
        </p>

        {/* ── Role Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, maxWidth: 700, margin: '0 auto' }}>

          {/* Patient Card */}
          <button
            onClick={() => handleUserTypeSelect('patient')}
            style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: '32px 24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#22c55e'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(34,197,94,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>🧑‍🤝‍🧑</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#111827', marginBottom: 6 }}>Enter as Patient</div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>Track vitals, check symptoms, book consultations</div>
            <div style={{ marginTop: 16, background: '#f0fdf4', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#15803d', fontWeight: 600 }}>→ Family Dashboard</div>
          </button>

          {/* Doctor Card */}
          <button
            onClick={() => handleUserTypeSelect('doctor')}
            style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: '32px 24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(59,130,246,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>👨‍⚕️</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#111827', marginBottom: 6 }}>Enter as Doctor</div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>View patient risk alerts, manage records & prescriptions</div>
            <div style={{ marginTop: 16, background: '#eff6ff', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>→ Clinical Dashboard</div>
          </button>

          {/* Pregnancy Card */}
          <button
            onClick={() => handleUserTypeSelect('pregnant')}
            style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: '32px 24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ec4899'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(236,72,153,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>🤰</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#111827', marginBottom: 6 }}>Pregnancy Care</div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>Diet plans, checkups, exercises & trimester tracker</div>
            <div style={{ marginTop: 16, background: '#fdf2f8', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#be185d', fontWeight: 600 }}>→ Maternal Dashboard</div>
          </button>

        </div>
      </section>

      {/* ── Feature Strip ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { icon: '📈', title: 'Time-Series Vitals', desc: 'Track BP, temp & weight trends daily', color: '#eff6ff', accent: '#1d4ed8' },
            { icon: '🚨', title: 'Anomaly Detection', desc: 'AI flags abnormal readings instantly', color: '#fef2f2', accent: '#dc2626' },
            { icon: '🧠', title: 'Explainable AI', desc: '0–100 risk score with reasoning', color: '#f0fdf4', accent: '#15803d' },
            { icon: '📞', title: 'Teleconsultation', desc: 'Video call doctors in seconds', color: '#faf5ff', accent: '#7c3aed' },
            { icon: '📄', title: 'Lab Report AI', desc: 'Upload PDF — AI extracts values', color: '#fff7ed', accent: '#c2410c' },
            { icon: '⌚', title: 'Wearable Sync', desc: 'Connect Apple Watch / Fitbit', color: '#f0fdf4', accent: '#15803d' },
            { icon: '🔒', title: 'Secure Architecture', desc: 'End-to-end encrypted medical data', color: '#f8fafc', accent: '#475569' },
            { icon: '📴', title: 'Offline Mode', desc: 'Logs vitals without internet connection', color: '#ecfeff', accent: '#0891b2' },
          ].map((f, i) => (
            <div key={i} style={{ background: f.color, borderRadius: 16, padding: '20px 16px', border: `1px solid ${f.accent}22` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid #f3f4f6', color: '#9ca3af', fontSize: 12 }}>
        <p>Kutumbh Care · AI-Powered Predictive Health Platform · Built for STAMPERS 2K26 Track 3</p>
      </footer>
    </div>
  );
}


export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <OfflineProvider>
          <DemoProvider>
            <AuthProvider>
              <SafeSpeechProvider>
                <SpeechRecognitionProvider>
                  <ErrorBoundary>
                    <div className="min-h-screen">
                      <AppContent />
                      <Toaster position="top-center" />
                    </div>
                  </ErrorBoundary>
                </SpeechRecognitionProvider>
              </SafeSpeechProvider>
            </AuthProvider>
          </DemoProvider>
        </OfflineProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
