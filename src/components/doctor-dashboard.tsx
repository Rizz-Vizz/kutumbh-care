import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useLanguage } from './language-context';
import { useAuth } from './auth-context';
import { useDemo } from './demo-context';
import { AdminHealthDashboard } from './admin-health-dashboard';


import { PatientRecords } from './patient-records';
import { PrescriptionPad } from './prescription-pad';
import { LanguageSwitcher } from './language-switcher';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  FileText, 
  BarChart3,
  Clock,
  Video,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  User,
  Activity,
  TrendingUp,
  MapPin,
  LogOut,
  Shield,
  ArrowRight
} from 'lucide-react';

interface DoctorDashboardProps {
  onBack: () => void;
}

export function DoctorDashboard({ onBack }: DoctorDashboardProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'patients' | 'prescription-pad' | 'analytics' | 'health-admin'>('dashboard');
  const { t, language, setLanguage } = useLanguage();
  const { userProfile } = useAuth();
  const { isDemoMode } = useDemo();
  
  
  const [newSurveyCount, setNewSurveyCount] = useState(0);
  
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  React.useEffect(() => {
    if (isDemoMode) {
      const checkForNewSurveys = () => {
        const surveys = JSON.parse(localStorage.getItem('demoSurveys') || '[]');
        const lastChecked = localStorage.getItem('lastSurveyCheck');
        const now = Date.now();
        
        if (lastChecked) {
          const newSurveys = surveys.filter((survey: any) => 
            new Date(survey.submissionDate).getTime() > parseInt(lastChecked)
          );
          setNewSurveyCount(newSurveys.length);
        } else {
          setNewSurveyCount(surveys.length);
        }
      };
      
      checkForNewSurveys();
      const interval = setInterval(checkForNewSurveys, 3000); 
      
      return () => clearInterval(interval);
    }
  }, [isDemoMode]);
  
  
  const handleHealthAdminClick = () => {
    localStorage.setItem('lastSurveyCheck', Date.now().toString());
    setNewSurveyCount(0);
    setActiveView('health-admin');
  };

  
  const todayStats = {
    appointments: 12,
    completed: 8,
    pending: 4,
    emergency: 2
  };

  const upcomingAppointments = [
    {
      id: 1,
      patient: { name: 'ਮਨਪ੍ਰੀਤ ਕੌਰ', nameEn: 'Manpreet Kaur', age: 35, id: 'NS001235' },
      time: '10:30 AM',
      type: 'video',
      symptoms: ['Fever', 'Cough'],
      priority: 'normal'
    },
    {
      id: 2,
      patient: { name: 'ਰਾਮ ਸਿੰਘ', nameEn: 'Ram Singh', age: 58, id: 'NS001236' },
      time: '11:00 AM', 
      type: 'audio',
      symptoms: ['Chest Pain', 'Breathing Problems'],
      priority: 'high'
    },
    {
      id: 3,
      patient: { name: 'ਪ੍ਰੀਤ ਸਿੰਘ', nameEn: 'Preet Singh', age: 28, id: 'NS001237' },
      time: '11:30 AM',
      type: 'video', 
      symptoms: ['Back Pain', 'Fatigue'],
      priority: 'normal'
    }
  ];

  const recentPatients = [
    {
      id: 1,
      name: 'ਸੁਰਿੰਦਰ ਕੌਰ',
      nameEn: 'Surinder Kaur',
      age: 42,
      lastVisit: 'Yesterday',
      diagnosis: 'Hypertension',
      followUp: 'Next week'
    },
    {
      id: 2,
      name: 'ਹਰਪ੍ਰੀਤ ਸਿੰਘ',
      nameEn: 'Harpreet Singh',
      age: 35,
      lastVisit: '2 days ago',
      diagnosis: 'Diabetes Type 2',
      followUp: 'In 2 weeks'
    },
    {
      id: 3,
      name: 'ਜਸਮੀਤ ਕੌਰ',
      nameEn: 'Jasmeet Kaur',
      age: 29,
      lastVisit: '3 days ago',
      diagnosis: 'Pregnancy Checkup',
      followUp: 'Next month'
    }
  ];

  const analyticsData = {
    monthlyStats: {
      totalConsultations: 342,
      newPatients: 89,
      followUps: 156,
      emergencies: 23
    },
    commonDiseases: [
      { disease: 'Hypertension', cases: 45, trend: '+12%' },
      { disease: 'Diabetes Type 2', cases: 38, trend: '+8%' },
      { disease: 'Respiratory Infections', cases: 29, trend: '-5%' },
      { disease: 'Musculoskeletal Pain', cases: 24, trend: '+15%' },
      { disease: 'Pregnancy Related', cases: 18, trend: '+20%' }
    ]
  };

  const startConsultation = (appointment: any) => {
    alert(`Starting ${appointment.type} consultation with ${appointment.patient.nameEn}`);
  };

  if (activeView === 'health-admin') {
    return <AdminHealthDashboard onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'patients') {
    return (
      <PatientRecords 
        onBack={() => setActiveView('dashboard')} 
        onStartConsultation={(patientId) => {
          alert(`Starting consultation with patient ${patientId}`);
        }}
        onWritePrescription={(patientId) => {
          setActiveView('prescription-pad');
        }}
      />
    );
  }

  if (activeView === 'prescription-pad') {
    return <PrescriptionPad onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'analytics') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Button variant="ghost" onClick={() => setActiveView('dashboard')} style={{ cursor: 'pointer' }}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="font-bold text-gray-800">{t('healthAnalytics')}</h1>
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              <div className="text-sm text-gray-600">City Region</div>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-6xl mx-auto space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
              Monthly Overview - December 2024
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{analyticsData.monthlyStats.totalConsultations}</div>
                <div className="text-sm text-blue-800 mt-1">Total Consultations</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{analyticsData.monthlyStats.newPatients}</div>
                <div className="text-sm text-green-800 mt-1">New Patients</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{analyticsData.monthlyStats.followUps}</div>
                <div className="text-sm text-orange-800 mt-1">Follow-ups</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{analyticsData.monthlyStats.emergencies}</div>
                <div className="text-sm text-red-800 mt-1">Emergencies</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-red-500" />
              Common Diseases in City Region
            </h3>
            <div className="space-y-3">
              {analyticsData.commonDiseases.map((disease, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-800">{disease.disease}</h4>
                    <p className="text-sm text-gray-600">{disease.cases} cases this month</p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center space-x-1 ${
                      disease.trend.startsWith('+') ? 'text-red-600' : 'text-green-600'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">{disease.trend}</span>
                    </div>
                    <p className="text-xs text-gray-500">vs last month</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-500" />
              Patient Distribution by Village
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">342</div>
                <div className="text-sm text-green-800 mt-1">Urban Areas</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">156</div>
                <div className="text-sm text-blue-800 mt-1">Rural Areas</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">89</div>
                <div className="text-sm text-purple-800 mt-1">Nearby Towns</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button 
  variant="outline" 
  onClick={onBack} 
  className="group relative overflow-hidden backdrop-blur-xl bg-white/60 border border-gray-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-white hover:-translate-y-0.5 transition-all duration-300 text-gray-700 font-bold flex items-center gap-2 rounded-xl px-4 py-2"
>
  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  <ArrowLeft className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-x-1" />
  <span className="relative z-10">Back</span>
</Button>
            <div>
              <h1 className="font-bold text-gray-800">
                {userProfile?.name || (isDemoMode ? 'Dr. Ravi Sharma' : 'Doctor')}
              </h1>
              <p className="text-sm text-gray-600">
                {userProfile?.specialty || (isDemoMode ? 'General Medicine' : 'Doctor')} • {userProfile?.hospital || (isDemoMode ? 'City PHC' : 'Hospital')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
              👩‍⚕️
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            
            <Button 
              variant="ghost" 
              onClick={onBack}
              style={{ cursor: 'pointer' }}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {/* AI Risk Alert Panel */}
        <div 
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          style={{ borderTop: '4px solid #ef4444' }}
        >
          <div className="p-4 border-b border-gray-100 bg-red-50/30">
            <h3 className="font-bold text-gray-800 flex items-center">
              🚨 AI Risk Alerts — Patients Needing Attention
            </h3>
          </div>
          <div className="p-4 grid gap-4 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">👨🏽</span>
                    <div>
                      <div className="font-semibold text-sm">Arjun Sharma, 45M</div>
                      <div className="text-xs text-gray-500">Risk Score: 78</div>
                    </div>
                  </div>
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full">HIGH RISK</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <p className="text-xs text-gray-600 mb-4">Systolic BP rising for 5 consecutive days (135→148 mmHg). Anomaly detected.</p>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs" style={{ cursor: 'pointer' }}>
                Review →
              </Button>
            </div>
            {/* Card 2 */}
            <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">👩🏽</span>
                    <div>
                      <div className="font-semibold text-sm">Priya Sharma, 40F</div>
                      <div className="text-xs text-gray-500">Risk Score: 52</div>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">MODERATE</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '52%' }}></div>
                </div>
                <p className="text-xs text-gray-600 mb-4">Temperature elevated above normal for 3 days. Trend suggests early infection.</p>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs" style={{ cursor: 'pointer' }}>
                Review →
              </Button>
            </div>
            {/* Card 3 */}
            <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">👦🏽</span>
                    <div>
                      <div className="font-semibold text-sm">Rohan Sharma, 12M</div>
                      <div className="text-xs text-gray-500">Risk Score: 22</div>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">NORMAL</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '22%' }}></div>
                </div>
                <p className="text-xs text-gray-600 mb-4">All vitals within normal range. Monitoring continued.</p>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs" style={{ cursor: 'pointer' }}>
                Review →
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{todayStats.appointments}</div>
            <div className="text-sm opacity-90">Today's Appointments</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{todayStats.completed}</div>
            <div className="text-sm opacity-90">Completed</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{todayStats.pending}</div>
            <div className="text-sm opacity-90">Pending</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-r from-red-500 to-red-600 text-white">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{todayStats.emergency}</div>
            <div className="text-sm opacity-90">Emergency</div>
          </Card>
        </div>

        {newSurveyCount > 0 && (
          <Card className="p-4 bg-green-50 border-green-200 border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800">
                    🚨 {newSurveyCount} New Environmental Health Survey{newSurveyCount > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-green-700">
                    Recent community health surveys require your attention
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleHealthAdminClick}
                className="bg-green-600 hover:bg-green-700"
                style={{ cursor: 'pointer' }}
              >
                View Surveys →
              </Button>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                {t('todayAppointments')}
              </h3>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{appointment.patient.name}</h4>
                        <p className="text-sm text-gray-600">{appointment.patient.nameEn} • Age {appointment.patient.age}</p>
                        <p className="text-xs text-gray-500">ID: {appointment.patient.id}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {appointment.symptoms.map((symptom, index) => (
                            <span key={index} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-blue-600">{appointment.time}</span>
                        {appointment.type === 'video' ? (
                          <Video className="w-4 h-4 text-green-500" />
                        ) : (
                          <Phone className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => startConsultation(appointment)}
                        style={{ cursor: 'pointer' }}
                        className={appointment.priority === 'high' ? 'bg-red-500 hover:bg-red-600' : ''}
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions & Recent Patients */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-500" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: 'patients',
                    title: 'Patient Records',
                    subtitle: 'View all patients',
                    icon: <Users className="w-5 h-5 text-blue-600" />,
                    color: 'bg-blue-100',
                    onClick: () => setActiveView('patients')
                  },
                  {
                    id: 'prescription-pad',
                    title: 'Prescription Pad',
                    subtitle: 'Write prescriptions',
                    icon: <FileText className="w-5 h-5 text-green-600" />,
                    color: 'bg-green-100',
                    onClick: () => setActiveView('prescription-pad')
                  },
                  {
                    id: 'analytics',
                    title: 'Health Analytics',
                    subtitle: 'View trends',
                    icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
                    color: 'bg-purple-100',
                    onClick: () => setActiveView('analytics')
                  },
                  {
                    id: 'health-admin',
                    title: 'Environmental Health',
                    subtitle: 'Surveys & Alerts',
                    icon: <Shield className="w-5 h-5 text-teal-600" />,
                    color: 'bg-teal-100',
                    onClick: handleHealthAdminClick,
                    badge: newSurveyCount > 0 ? newSurveyCount : null
                  }
                ].map((action, idx) => (
                  <div
                    key={idx}
                    onClick={action.onClick}
                    style={{ cursor: 'pointer' }}
                    className="group bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                        {action.icon}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{action.title}</div>
                        <div className="text-sm text-gray-500">{action.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {action.badge && (
                        <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center mr-2 animate-pulse">
                          {action.badge}
                        </div>
                      )}
                      <span className="text-gray-400 group-hover:text-gray-800 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Recent Patients
              </h3>
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-green-800">{patient.name}</h4>
                      <span className="text-xs text-green-600">{patient.lastVisit}</span>
                    </div>
                    <p className="text-sm text-green-700">{patient.nameEn} • Age {patient.age}</p>
                    <p className="text-xs text-green-600">Diagnosis: {patient.diagnosis}</p>
                    <p className="text-xs text-gray-600">Follow-up: {patient.followUp}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">℮</span>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-2">Connected to eSanjeevani Platform</h3>
              <p className="text-sm text-blue-700">
                All consultations are integrated with Government of India's telemedicine platform. 
                Patient data is securely stored and accessible across all government health facilities.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
