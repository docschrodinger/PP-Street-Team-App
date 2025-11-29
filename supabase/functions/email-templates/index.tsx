import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Link,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';

// --- SHARED STYLES (THEME: ELITE UNDERGROUND) ---
const theme = {
  colors: {
    black: '#000000',
    darkGray: '#121212',
    offWhite: '#F8F4EE',
    orange: '#F1511B',
    purple: '#3A2B86',
    purpleDark: '#2A1F65',
  },
};

const styles = {
  main: {
    backgroundColor: theme.colors.black,
    fontFamily: 'Helvetica, Arial, sans-serif',
    padding: '40px 0',
  },
  container: {
    margin: '0 auto',
    maxWidth: '600px',
    backgroundColor: theme.colors.darkGray,
    border: `2px solid ${theme.colors.offWhite}`,
    borderRadius: '0px', // Neo-brutalist square
    boxShadow: `8px 8px 0px ${theme.colors.orange}`, // Hard orange shadow
  },
  header: {
    backgroundColor: theme.colors.purple,
    padding: '20px',
    borderBottom: `2px solid ${theme.colors.offWhite}`,
    textAlign: 'center',
  },
  logo: {
    display: 'block',
    margin: '0 auto',
    maxWidth: '80px',
  },
  content: {
    padding: '32px 24px',
  },
  heading: {
    fontFamily: 'Impact, sans-serif', // Heavy, condensed
    fontSize: '36px',
    lineHeight: '1',
    fontWeight: '900',
    color: theme.colors.offWhite,
    textTransform: 'uppercase',
    textAlign: 'center',
    margin: '0 0 16px',
    letterSpacing: '1px',
  },
  subHeading: {
    fontSize: '18px',
    fontWeight: '700',
    color: theme.colors.orange,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: '24px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: theme.colors.offWhite,
    margin: '0 0 20px',
  },
  highlightBox: {
    backgroundColor: theme.colors.black,
    border: `1px solid ${theme.colors.orange}`,
    padding: '20px',
    margin: '24px 0',
    textAlign: 'center',
    boxShadow: `4px 4px 0px ${theme.colors.purple}`,
  },
  statValue: {
    fontFamily: 'Impact, sans-serif',
    fontSize: '42px',
    color: theme.colors.orange,
    margin: '0',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '14px',
    color: theme.colors.offWhite,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '8px',
  },
  button: {
    backgroundColor: theme.colors.orange,
    color: theme.colors.black,
    fontSize: '18px',
    fontWeight: '900',
    textTransform: 'uppercase',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    padding: '16px 32px',
    border: `2px solid ${theme.colors.offWhite}`,
    boxShadow: `4px 4px 0px ${theme.colors.offWhite}`,
    margin: '32px auto 0',
    width: 'fit-content',
  },
  footer: {
    backgroundColor: theme.colors.black,
    borderTop: `2px solid ${theme.colors.offWhite}`,
    padding: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#888888',
    margin: '0 0 8px',
  },
  footerLink: {
    color: theme.colors.orange,
    textDecoration: 'underline',
  },
  footerLogo: {
    maxWidth: '40px',
    margin: '16px auto 0',
  }
};

const SUPABASE_PROJECT_ID = 'djsuqvmefbgnmoyfpqhi'; // Replace with your actual project ID
const LOGO_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/email-assets/3.svg`;
const FOOTER_LOGO_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/email-assets/4.svg`;

// --- EMAIL 1: APPLICATION RECEIVED ---
export const ApplicationReceivedEmail = ({ applicantName = 'Candidate' }) => (
  <Html>
    <Head />
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
           <Img src={LOGO_URL} width="60" style={styles.logo} alt="Patron Pass HQ" />
        </Section>
        <Section style={styles.content}>
          <Text style={styles.heading}>INTEL RECEIVED</Text>
          <Text style={styles.paragraph}>
            Stand by, {applicantName}.
          </Text>
          <Text style={styles.paragraph}>
            We've received your application to join the Patron Pass Street Team. Our handlers at HQ are currently reviewing your dossier to see if you have what it takes to operate in the field.
          </Text>
          <Section style={styles.highlightBox}>
            <Text style={{...styles.statLabel, color: theme.colors.orange}}>STATUS</Text>
            <Text style={{fontSize: '24px', fontWeight: 'bold', color: theme.colors.offWhite, margin: '8px 0 0'}}>UNDER REVIEW</Text>
          </Section>
          <Text style={styles.paragraph}>
            Expect a transmission within 48 hours. Keep your comms open.
          </Text>
          <Text style={styles.paragraph}>
            - HQ
          </Text>
        </Section>
        <Footer />
      </Container>
    </Body>
  </Html>
);

// --- EMAIL 2: APPLICATION APPROVED ---
export const ApplicationApprovedEmail = ({ applicantName = 'Agent' }) => (
  <Html>
    <Head />
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
           <Img src={LOGO_URL} width="60" style={styles.logo} alt="Patron Pass HQ" />
        </Section>
        <Section style={styles.content}>
          <Text style={styles.heading}>WELCOME TO THE UNDERGROUND</Text>
          <Text style={styles.subHeading}>ACCESS GRANTED</Text>
          <Text style={styles.paragraph}>
            Listen up, {applicantName}. You made the cut.
          </Text>
          <Text style={styles.paragraph}>
            The Patron Pass Street Team isn't for everyone, but we see potential in you. You are now authorized to access Mission Control.
          </Text>
          <Section style={styles.highlightBox}>
             <Text style={styles.paragraph}>
               <strong>YOUR MISSION:</strong><br/>
               Initialize your account, sign your contract, and prepare for your first run.
             </Text>
          </Section>
          <Button href="https://street-team.patronpass.com/login" style={styles.button}>
            INITIALIZE AGENT ACCOUNT
          </Button>
        </Section>
        <Footer />
      </Container>
    </Body>
  </Html>
);

// --- EMAIL 3: MISSION COMPLETE ---
export const MissionCompleteEmail = ({ 
  agentName = 'Agent', 
  missionTitle = 'Night Owl Run', 
  xpEarned = 150 
}) => (
  <Html>
    <Head />
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
           <Img src={LOGO_URL} width="60" style={styles.logo} alt="Patron Pass HQ" />
        </Section>
        <Section style={styles.content}>
          <Text style={styles.heading}>MISSION ACCOMPLISHED</Text>
          <Text style={styles.paragraph}>
            Solid work out there, {agentName}.
          </Text>
          <Text style={styles.paragraph}>
            You just crushed the <strong>"{missionTitle}"</strong> objective. HQ has confirmed the intel and processed your reward.
          </Text>
          
          <Section style={styles.highlightBox}>
            <Row>
              <Column align="center">
                <Text style={styles.statValue}>+{xpEarned}</Text>
                <Text style={styles.statLabel}>XP ADDED</Text>
              </Column>
            </Row>
          </Section>

          <Text style={styles.paragraph}>
            You're one step closer to the next rank. Don't stop now—momentum is everything.
          </Text>

          <Button href="https://street-team.patronpass.com/missions" style={styles.button}>
            VIEW NEXT MISSION
          </Button>
        </Section>
        <Footer />
      </Container>
    </Body>
  </Html>
);

// --- EMAIL 4: RANK UP ---
export const RankUpEmail = ({ 
  agentName = 'Operative', 
  newRank = 'SILVER',
  oldRank = 'BRONZE'
}) => (
  <Html>
    <Head />
    <Body style={styles.main}>
      <Container style={{...styles.container, borderColor: theme.colors.orange}}>
        <Section style={{...styles.header, backgroundColor: theme.colors.orange}}>
           <Img src={LOGO_URL} width="60" style={styles.logo} alt="Patron Pass HQ" />
        </Section>
        <Section style={styles.content}>
          <Text style={styles.heading}>PROMOTION ALERT</Text>
          
          <Img 
            src={`https://patronpass.com/assets/ranks/${newRank.toLowerCase()}.png`} 
            width="120" 
            height="120"
            alt={newRank}
            style={{ display: 'block', margin: '20px auto' }} 
          />

          <Text style={{...styles.subHeading, color: theme.colors.offWhite}}>
            {oldRank} ➔ <span style={{color: theme.colors.orange}}>{newRank}</span>
          </Text>

          <Text style={styles.paragraph}>
            Respect, {agentName}. You've put in the work, hit your numbers, and climbed the ladder.
          </Text>
          <Text style={styles.paragraph}>
            You have officially reached the <strong>{newRank}</strong> tier. This clearance level comes with higher payouts, exclusive missions, and serious bragging rights.
          </Text>

          <Button href="https://street-team.patronpass.com/profile" style={styles.button}>
            VIEW NEW CLEARANCE
          </Button>
        </Section>
        <Footer />
      </Container>
    </Body>
  </Html>
);

// --- EMAIL 5: WEEKLY SUMMARY ---
export const WeeklySummaryEmail = ({ 
  agentName = 'Agent',
  xpEarned = 1250,
  leadsAdded = 14,
  estimatedEarnings = 450
}) => (
  <Html>
    <Head />
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
           <Img src={LOGO_URL} width="60" style={styles.logo} alt="Patron Pass HQ" />
        </Section>
        <Section style={styles.content}>
          <Text style={styles.heading}>WEEKLY INTEL REPORT</Text>
          <Text style={styles.paragraph}>
            Here is your performance debrief for the week, {agentName}.
          </Text>

          <Section style={{...styles.highlightBox, padding: '10px'}}>
            <Row>
              <Column style={{borderRight: `1px solid ${theme.colors.darkGray}`, padding: '10px', width: '50%'}}>
                <Text style={{...styles.statValue, fontSize: '32px'}}>{leadsAdded}</Text>
                <Text style={styles.statLabel}>NEW LEADS</Text>
              </Column>
              <Column style={{padding: '10px', width: '50%'}}>
                <Text style={{...styles.statValue, fontSize: '32px'}}>{xpEarned}</Text>
                <Text style={styles.statLabel}>XP EARNED</Text>
              </Column>
            </Row>
            <Hr style={{borderColor: theme.colors.darkGray, margin: '0'}} />
            <Row>
              <Column style={{padding: '20px 0 10px'}}>
                <Text style={{...styles.statValue, color: '#FFFFFF'}}>${estimatedEarnings}</Text>
                <Text style={styles.statLabel}>EST. COMMISSION CUT</Text>
              </Column>
            </Row>
          </Section>

          <Text style={styles.paragraph}>
            The leaderboard resets tomorrow. Check the active bounties and plan your route.
          </Text>

          <Button href="https://street-team.patronpass.com/dashboard" style={styles.button}>
            ACCESS DASHBOARD
          </Button>
        </Section>
        <Footer />
      </Container>
    </Body>
  </Html>
);

// --- SHARED FOOTER ---
const Footer = () => (
  <Section style={styles.footer}>
    <Text style={styles.footerText}>
      CONFIDENTIAL TRANSMISSION // PATRON PASS HQ
    </Text>
    <Text style={styles.footerText}>
      <Link href="https://patronpass.com/about" style={styles.footerLink}>Mission Protocol</Link> • <Link href="https://patronpass.com/contact" style={styles.footerLink}>Support Line</Link>
    </Text>
    <Img src={FOOTER_LOGO_URL} width="40" style={styles.footerLogo} alt="Patron Pass" />
  </Section>
);

export default ApplicationReceivedEmail;
