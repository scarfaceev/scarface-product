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
  let html: string | undefined;
  let replyTo: string | undefined;

  if (notification.enquiry) {
    const enquiry = notification.enquiry;
    const acknowledgement = notification.type === "ENQUIRY_ACK";
    subject = acknowledgement ? "We received your ScarfaceEV enquiry" : "New ScarfaceEV website enquiry";
    if (acknowledgement) {
      text = `Hello ${enquiry.fullName},\n\nThank you for contacting ScarfaceEV. We received your enquiry and will follow up.\n`;
    } else {
      const submittedAt = enquiry.createdAt.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
      const details: Array<[string, string]> = [
        ["Customer name", enquiry.fullName],
        ["Email address", enquiry.email],
        ["Phone number", enquiry.phone ?? "Not provided"],
        ["Enquiry category", enquiry.interest],
        ["Message", enquiry.message],
        ["Submitted", submittedAt],
      ];
      text = `A new website enquiry was received by ScarfaceEV.\n\n${details.map(([label, value]) => `${label}: ${value}`).join("\n\n")}`;
      html = `<div style="background:#f3f6f7;padding:32px 16px;font-family:Arial,sans-serif;color:#17252b"><div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden"><div style="background:#102a31;padding:24px 32px;color:#fff"><div style="font-size:12px;letter-spacing:2px;color:#70d8c6">SCARFACE EV</div><h1 style="font-size:22px;margin:10px 0 0">New website enquiry</h1></div><div style="padding:24px 32px"><p style="margin-top:0">A new enquiry was submitted through the ScarfaceEV website.</p><table style="width:100%;border-collapse:collapse"><tbody>${details.map(([label, value]) => `<tr><th style="width:150px;padding:12px 10px;text-align:left;vertical-align:top;border-bottom:1px solid #e6ecee;color:#52666c;font-size:13px">${escapeHtml(label)}</th><td style="padding:12px 10px;vertical-align:top;border-bottom:1px solid #e6ecee;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join("")}</tbody></table><p style="margin-bottom:0;color:#52666c;font-size:12px">Reply directly to this email to contact the customer.</p></div></div></div>`;
      replyTo = enquiry.email;
    }
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

  return { subject, text, html: html ?? `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</div>`, replyTo };
}
