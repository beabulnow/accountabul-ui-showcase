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

interface SignupEmailProps {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{" "}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SignupEmail;

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
