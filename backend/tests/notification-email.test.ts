import { afterEach, describe, expect, it, vi } from "vitest";
import { ResendEmailProvider } from "../src/modules/notifications/email-provider.js";
import { renderNotification } from "../src/modules/notifications/templates.js";

const createdAt = new Date("2026-11-28T05:15:00.000Z");
const enquiryNotification = {
  id: "c6204c65-eec4-4fd8-9dd4-2feb8fb44885",
  dedupeKey: "ENQUIRY_ADMIN:c6204c65-eec4-4fd8-9dd4-2feb8fb44885:company",
  type: "ENQUIRY_ADMIN",
  recipient: "company@example.com",
  status: "PENDING",
  retryCount: 0,
  nextRetryAt: createdAt,
  lockedAt: null,
  providerReference: null,
  lastError: null,
  createdAt,
  sentAt: null,
  enquiryId: "c6204c65-eec4-4fd8-9dd4-2feb8fb44885",
  installationRequestId: null,
  jobApplicationId: null,
  enquiry: {
    id: "c6204c65-eec4-4fd8-9dd4-2feb8fb44885",
    fullName: "Example Customer",
    email: "customer@example.com",
    phone: null,
    interest: "Home charger",
    message: "Please review <script>alert('no')</script>",
    status: "NEW",
    createdAt,
    updatedAt: createdAt,
    resolvedAt: null,
  },
  installationRequest: null,
  jobApplication: null,
} satisfies Parameters<typeof renderNotification>[0];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("enquiry notification email", () => {
  it("renders readable enquiry details, submission time, and safely escaped HTML", () => {
    const message = renderNotification(enquiryNotification);

    expect(message.text).toContain("Customer name: Example Customer");
    expect(message.text).toContain("Phone number: Not provided");
    expect(message.text).toContain("Submitted: 2026-11-28 05:15:00 UTC");
    expect(message.html).toContain("SCARFACE EV");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.html).not.toContain("<script>");
    expect(message.replyTo).toBe("customer@example.com");
  });

  it("sends Reply-To to Resend and reports provider delivery failures", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "email-id" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("provider unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new ResendEmailProvider();

    await provider.send({ to: "company@example.com", ...renderNotification(enquiryNotification) });
    const requestInit = fetchMock.mock.calls[0]?.[1];
    const sentPayload = JSON.parse(String(requestInit?.body));
    expect(sentPayload.to).toEqual(["company@example.com"]);
    expect(sentPayload.reply_to).toBe("customer@example.com");

    await expect(provider.send({ to: "company@example.com", subject: "test", text: "test", html: "test" }))
      .rejects.toThrow("Email provider returned HTTP 503.");
  });
});
