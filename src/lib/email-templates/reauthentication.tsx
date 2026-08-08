import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm reauthentication</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Work Sans', -apple-system, Helvetica, Arial, sans-serif",
  color: '#25353d',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '36px 32px',
  border: '1px solid #e4e7e1',
  borderRadius: '14px',
}
const h1 = {
  fontFamily: "Georgia, 'Instrument Serif', serif",
  fontSize: '26px',
  fontWeight: 'normal' as const,
  color: '#1d2c33',
  letterSpacing: '-0.01em',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#4a5a61',
  lineHeight: '1.6',
  margin: '0 0 22px',
}
const footer = {
  fontSize: '12px',
  color: '#8a9499',
  lineHeight: '1.6',
  borderTop: '1px solid #e4e7e1',
  paddingTop: '18px',
  margin: '32px 0 0',
}
const codeStyle = {
  display: 'inline-block',
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: '24px',
  letterSpacing: '0.18em',
  color: '#1d2c33',
  backgroundColor: '#f4f6f2',
  border: '1px solid #e4e7e1',
  borderRadius: '10px',
  padding: '14px 20px',
  margin: '0 0 22px',
}
