import type { NotificationOutbox, Enquiry, InstallationRequest, JobApplication, Job } from "@prisma/client";

type NotificationWithData = NotificationOutbox & {
  enquiry: Enquiry | null;
  installationRequest: InstallationRequest | null;
  jobApplication: (JobApplication & { job: Job }) | null;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function formatLines(values: Array<[string, string | null | undefined]>): string {
  return values.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join("\n");
}

export function renderNotification(notification: NotificationWithData) {
  let subject = "ScarfaceEV notification";
  let text = "A new ScarfaceEV notification is available.";

  if (notification.enquiry) {
    const enquiry = notification.enquiry;
    const acknowledgement = notification.type === "ENQUIRY_ACK";
    subject = acknowledgement ? "We received your ScarfaceEV enquiry" : "New ScarfaceEV website enquiry";
    text = acknowledgement
      ? `Hello ${enquiry.fullName},\n\nThank you for contacting ScarfaceEV. We received your enquiry and will follow up.\n`
      : `A new website enquiry was received.\n\n${formatLines([
        ["Name", enquiry.fullName],
        ["Email", enquiry.email],
        ["Phone", enquiry.phone],
        ["Interest", enquiry.interest],
        ["Message", enquiry.message],
      ])}`;
  } else if (notification.installationRequest) {
    const request = notification.installationRequest;
    subject = "New ScarfaceEV installation request";
    text = `A new installation request was received.\n\n${formatLines([
      ["Name", request.fullName],
      ["Email", request.email],
      ["Phone", request.phone],
      ["Type", request.installationType],
      ["Property", request.propertyType],
      ["Address", [request.addressLine1, request.addressLine2, request.city, request.region, request.postalCode, request.country].filter(Boolean).join(", ")],
      ["Requirements", request.additionalRequirements],
    ])}`;
  } else if (notification.jobApplication) {
    const application = notification.jobApplication;
    if (notification.type === "JOB_APPLICATION_ACK") {
      subject = "We received your ScarfaceEV application";
      text = `Hello ${application.applicantName},\n\nThank you for applying for ${application.job.title}. We received your application.\n`;
    } else {
      subject = "New ScarfaceEV job application";
      text = `A job application was received.\n\n${formatLines([
        ["Job", application.job.title],
        ["Applicant", application.applicantName],
        ["Email", application.email],
        ["Phone", application.phone],
      ])}\n\nThe resume is stored privately and is not attached to this email.`;
    }
  }

  const html = `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</div>`;
  return { subject, text, html };
}
