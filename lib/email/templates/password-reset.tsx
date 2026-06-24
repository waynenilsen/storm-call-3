import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export interface PasswordResetEmailProps {
  resetUrl: string;
  expiresInMinutes: number;
}

export function PasswordResetEmail({
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Storm Call password</Preview>
      <Body
        style={{ backgroundColor: "#f6f6f6", fontFamily: "Arial, sans-serif" }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "40px auto",
            padding: "32px",
            maxWidth: "520px",
            borderRadius: "8px",
          }}
        >
          <Heading style={{ fontSize: "20px", margin: "0 0 16px" }}>
            Reset your password
          </Heading>
          <Text style={{ fontSize: "14px", lineHeight: "1.5" }}>
            We received a request to reset the password for your Storm Call
            account. Click the button below to choose a new password.
          </Text>
          <Button
            href={resetUrl}
            style={{
              backgroundColor: "#111827",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              margin: "16px 0",
            }}
          >
            Reset password
          </Button>
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            Or paste this URL into your browser:
            <br />
            {resetUrl}
          </Text>
          <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            This link expires in {expiresInMinutes} minutes. If you didn't
            request a password reset, you can safely ignore this email — your
            password will not change.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
