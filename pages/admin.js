// pages/admin.js - Admin Settings Panel
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { fetchAdminSettings, saveAdminSettings } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  darkTheme,
  borderRadius,
  cardStyle,
  buttonPrimaryStyle,
  inputStyle,
  fontSize,
  fontWeight,
  fontFamily,
  transitions,
  shadows,
} from '../lib/theme';

// Check if current user is admin
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const colors = darkTheme;
  const isAdmin = user?.id === ADMIN_USER_ID;

  // Load admin settings
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/');
      return;
    }

    async function loadSettings() {
      try {
        const res = await fetchAdminSettings();
        if (res?.settings) {
          setSettings(res.settings);
        } else if (res?.error) {
          setError(res.error);
        }
      } catch (e) {
        setError(e.message || 'Failed to load admin settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user, authLoading, isAdmin, router]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await saveAdminSettings({
        global_kill_switch: settings.global_kill_switch,
        subscription_plus_price: parseFloat(settings.subscription_plus_price),
        subscription_pro_price: parseFloat(settings.subscription_pro_price),
      });

      if (res?.ok) {
        setSuccess(true);
        if (res.settings) {
          setSettings(res.settings);
        }
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res?.error || 'Failed to save settings');
      }
    } catch (e) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Toggle kill switch
  const toggleKillSwitch = () => {
    setSettings(prev => ({
      ...prev,
      global_kill_switch: !prev.global_kill_switch,
    }));
  };

  // Update price
  const updatePrice = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (authLoading || loading) {
    return (
      <Layout active="admin">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout active="admin">
        <div style={{
          ...cardStyle,
          padding: 40,
          textAlign: 'center',
        }}>
          <h2 style={{ color: colors.error, marginBottom: 16 }}>Access Denied</h2>
          <p style={{ color: colors.textSecondary }}>
            You do not have permission to access admin settings.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout active="admin">
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(248, 81, 73, 0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: fontSize['2xl'],
          fontWeight: fontWeight.bold,
          fontFamily: fontFamily.display,
          color: colors.textPrimary,
          marginBottom: 8,
        }}>
          Admin Settings
        </h1>
        <p style={{
          fontSize: fontSize.base,
          color: colors.textSecondary,
        }}>
          System-wide controls and configuration
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          ...cardStyle,
          padding: 16,
          marginBottom: 24,
          background: 'rgba(248, 81, 73, 0.1)',
          borderColor: colors.error,
        }}>
          <span style={{ color: colors.error }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          ...cardStyle,
          padding: 16,
          marginBottom: 24,
          background: 'rgba(63, 185, 80, 0.1)',
          borderColor: colors.success,
        }}>
          <span style={{ color: colors.success }}>Settings saved successfully!</span>
        </div>
      )}

      {/* Global Kill Switch */}
      <div style={{
        ...cardStyle,
        padding: 24,
        marginBottom: 24,
        border: settings?.global_kill_switch
          ? `2px solid ${colors.error}`
          : `1px solid ${colors.border}`,
        background: settings?.global_kill_switch
          ? 'rgba(248, 81, 73, 0.05)'
          : cardStyle.background,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              color: colors.textPrimary,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              Global Kill Switch
              {settings?.global_kill_switch && (
                <span style={{
                  fontSize: fontSize.xs,
                  padding: '4px 10px',
                  borderRadius: borderRadius.full,
                  background: colors.error,
                  color: '#fff',
                  fontWeight: fontWeight.bold,
                  animation: 'pulse-red 2s infinite',
                }}>
                  ACTIVE
                </span>
              )}
            </h3>
            <p style={{
              fontSize: fontSize.sm,
              color: colors.textSecondary,
              maxWidth: 400,
            }}>
              When enabled, ALL trading is halted system-wide. No new positions will be opened for any user.
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={toggleKillSwitch}
            style={{
              width: 80,
              height: 44,
              borderRadius: 22,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: transitions.normal,
              background: settings?.global_kill_switch
                ? colors.error
                : colors.bgTertiary,
              boxShadow: settings?.global_kill_switch
                ? `0 0 20px ${colors.error}40`
                : 'none',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 4,
              left: settings?.global_kill_switch ? 40 : 4,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#fff',
              transition: transitions.normal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: fontSize.lg,
            }}>
              {settings?.global_kill_switch ? '!' : ''}
            </div>
          </button>
        </div>
      </div>

      {/* Subscription Pricing */}
      <div style={{
        ...cardStyle,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{
          fontSize: fontSize.lg,
          fontWeight: fontWeight.semibold,
          color: colors.textPrimary,
          marginBottom: 8,
        }}>
          Subscription Pricing
        </h3>
        <p style={{
          fontSize: fontSize.sm,
          color: colors.textSecondary,
          marginBottom: 24,
        }}>
          Set monthly subscription prices for Plus and Pro tiers
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
        }}>
          {/* Plus Tier */}
          <div>
            <label style={{
              display: 'block',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              color: colors.textSecondary,
              marginBottom: 8,
            }}>
              Plus Tier ($/month)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.textMuted,
                fontSize: fontSize.lg,
              }}>
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings?.subscription_plus_price ?? 14.99}
                onChange={(e) => updatePrice('subscription_plus_price', e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: 36,
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Pro Tier */}
          <div>
            <label style={{
              display: 'block',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              color: colors.textSecondary,
              marginBottom: 8,
            }}>
              Pro Tier ($/month)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.textMuted,
                fontSize: fontSize.lg,
              }}>
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings?.subscription_pro_price ?? 29.99}
                onChange={(e) => updatePrice('subscription_pro_price', e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: 36,
                  width: '100%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...buttonPrimaryStyle,
            padding: '14px 32px',
            fontSize: fontSize.base,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Layout>
  );
}
