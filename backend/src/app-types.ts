import type { ContentService } from "./modules/cms/content.service.js";
import type { EnquiryService } from "./modules/enquiries/enquiry.service.js";
import type { InstallationService } from "./modules/installations/installation.service.js";
import type { JobApplicationService, JobService } from "./modules/jobs/job.service.js";
import type { MediaService } from "./modules/media/media.service.js";
import type { ProductService } from "./modules/products/product.service.js";

export interface AppServices {
  enquiries: Pick<EnquiryService, "create">;
  products: Pick<ProductService, "listPublished" | "getPublishedById">;
  installations: Pick<InstallationService, "create">;
  jobs: Pick<JobService, "listPublished" | "getPublishedById">;
  applications: Pick<JobApplicationService, "create">;
  content: Pick<ContentService, "listPublished" | "getPublishedBySlug">;
  media: Pick<MediaService, "getPublicAsset">;
}

export interface AppDependencies {
  services?: AppServices;
  checkDatabase?: () => Promise<void>;
}
