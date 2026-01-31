// pages/terms.js - Terms of Service
import { colors, fontSize, fontWeight, shadows } from '../lib/theme';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: colors.bgSecondary,
        borderRadius: '16px',
        padding: '40px',
        boxShadow: shadows.xl,
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: fontSize.xl,
              fontWeight: fontWeight.bold,
              color: colors.accent,
            }}>
              Flux
            </span>
          </Link>
        </div>

        <h1 style={{
          fontSize: fontSize['2xl'],
          fontWeight: fontWeight.bold,
          color: colors.textPrimary,
          marginBottom: '8px',
        }}>
          Terms of Service
        </h1>
        <p style={{
          fontSize: fontSize.sm,
          color: colors.textMuted,
          marginBottom: '32px',
        }}>
          Last updated: January 30, 2026
        </p>

        {/* Important Notice */}
        <div style={{
          background: 'rgba(212, 165, 116, 0.1)',
          border: `1px solid ${colors.accent}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
        }}>
          <h3 style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.semibold,
            color: colors.accent,
            marginBottom: '8px',
          }}>
            Important Notice
          </h3>
          <p style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Flux is a software platform that provides trading automation tools.
            <strong> Flux is not a broker, financial advisor, or investment manager.</strong> We do not custody your funds,
            execute trades on your behalf (your connected broker does), or provide investment advice.
            Trading involves substantial risk of loss.
          </p>
        </div>

        {/* Sections */}
        <Section title="1. Acceptance of Terms">
          By accessing or using Flux, you agree to be bound by these Terms of Service. If you do not agree
          to these terms, you may not use our service.
        </Section>

        <Section title="2. Description of Service">
          <p>Flux provides:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Software tools for automated trading strategy execution</li>
            <li>Analytics and performance tracking dashboards</li>
            <li>Risk management features and controls</li>
            <li>Integration with third-party brokerage services</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Flux does NOT provide:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Brokerage services or fund custody</li>
            <li>Investment advice or recommendations</li>
            <li>Guarantees of profit or trading performance</li>
            <li>Insurance or protection against trading losses</li>
          </ul>
        </Section>

        <Section title="3. User Responsibilities">
          <p>As a user, you are responsible for:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Maintaining the security of your account credentials</li>
            <li>All trading activity conducted through your account</li>
            <li>Ensuring your use complies with applicable laws and regulations</li>
            <li>Understanding the risks associated with trading</li>
            <li>Configuring appropriate risk management settings</li>
            <li>Monitoring your positions and account activity</li>
          </ul>
        </Section>

        <Section title="4. Broker Connections">
          <p>
            When you connect a brokerage account to Flux, you authorize Flux to send trading instructions
            to your broker on your behalf based on your configured strategies and settings. You understand that:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Your broker executes all trades, not Flux</li>
            <li>Flux stores your API credentials securely but does not custody funds</li>
            <li>You can revoke Flux's access at any time through your broker</li>
            <li>Flux is not responsible for broker outages or execution issues</li>
          </ul>
        </Section>

        <Section title="5. Risk Disclosure">
          <p style={{ fontWeight: fontWeight.semibold, color: colors.warning }}>
            Trading involves substantial risk of loss and is not suitable for all investors.
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Past performance does not guarantee future results</li>
            <li>You may lose some or all of your invested capital</li>
            <li>Automated trading systems can malfunction or behave unexpectedly</li>
            <li>Market conditions can change rapidly and unpredictably</li>
            <li>You should only trade with capital you can afford to lose</li>
          </ul>
        </Section>

        <Section title="6. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLUX AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Trading losses or missed trading opportunities</li>
            <li>System downtime or technical failures</li>
            <li>Unauthorized access to your account</li>
            <li>Errors in trading algorithms or strategies</li>
          </ul>
        </Section>

        <Section title="7. Subscription and Billing">
          <p>
            Flux offers both free and paid subscription tiers. Paid subscriptions are billed on a recurring
            basis. You may cancel at any time, and cancellation will take effect at the end of your current
            billing period.
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            We reserve the right to suspend or terminate your account at any time for violation of these
            terms or for any other reason at our discretion. Upon termination, your access to Flux will
            be revoked immediately.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>
            We may update these terms from time to time. Continued use of Flux after changes constitutes
            acceptance of the updated terms. We will notify users of material changes via email or
            in-app notification.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These terms shall be governed by and construed in accordance with the laws of the State of
            California, without regard to its conflict of law provisions.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For questions about these terms, please contact us at support@flux.trading
          </p>
        </Section>

        {/* Back Link */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link href="/login" style={{
            color: colors.accent,
            textDecoration: 'none',
            fontSize: fontSize.sm,
          }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: '12px',
      }}>
        {title}
      </h2>
      <div style={{
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 1.7,
      }}>
        {children}
      </div>
    </div>
  );
}
