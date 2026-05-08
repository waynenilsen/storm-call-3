import { render } from "@react-email/render";

import {
  PasswordResetEmail,
  type PasswordResetEmailProps,
} from "./templates/password-reset";

export async function renderPasswordResetEmail(props: PasswordResetEmailProps) {
  const element = PasswordResetEmail(props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
