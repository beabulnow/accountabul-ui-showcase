import * as React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface InviteEmailProps {
  siteName: string;
  siteUrl: string;
  confirmationUrl: string;
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{" "}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Click the button below to accept the invitation and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InviteEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "'Work Sans', -apple-system, Helvetica, Arial, sans-serif",
  color: "#25353d",
};
const container = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "36px 32px",
  border: "1px solid #e4e7e1",
  borderRadius: "14px",
};
const h1 = {
  fontFamily: "Georgia, 'Instrument Serif', serif",
  fontSize: "26px",
  fontWeight: "normal" as const,
  color: "#1d2c33",
  letterSpacing: "-0.01em",
  margin: "0 0 20px",
};
const text = {
  fontSize: "15px",
  color: "#4a5a61",
  lineHeight: "1.6",
  margin: "0 0 22px",
};
const link = { color: "#2a4653", textDecoration: "underline" };
const button = {
  backgroundColor: "#2a4653",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "500" as const,
  borderRadius: "10px",
  padding: "13px 24px",
  textDecoration: "none",
  display: "inline-block",
};
const footer = {
  fontSize: "12px",
  color: "#8a9499",
  lineHeight: "1.6",
  borderTop: "1px solid #e4e7e1",
  paddingTop: "18px",
  margin: "32px 0 0",
};
