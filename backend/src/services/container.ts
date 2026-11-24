import { prisma } from "../database/prisma.js";
import { ContentService } from "../modules/cms/content.service.js";
import { EnquiryService } from "../modules/enquiries/enquiry.service.js";
import { InstallationService } from "../modules/installations/installation.service.js";
import { JobApplicationService, JobService } from "../modules/jobs/job.service.js";
import { createStorageAdapter } from "../modules/media/storage-factory.js";
import { MediaService } from "../modules/media/media.service.js";
import { NotificationService } from "../modules/notifications/notification.service.js";
import { ProductService } from "../modules/products/product.service.js";

const storage = createStorageAdapter();
const notifications = new NotificationService(prisma);
const media = new MediaService(prisma, storage);

export const services = {
  enquiries: new EnquiryService(prisma, notifications),
  products: new ProductService(prisma),
  installations: new InstallationService(prisma, notifications),
  jobs: new JobService(prisma),
  applications: new JobApplicationService(prisma, media, notifications),
  content: new ContentService(prisma),
  media,
};

export { media, notifications, storage };
