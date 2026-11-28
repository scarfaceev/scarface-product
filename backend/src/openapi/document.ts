export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "ScarfaceEV API",
    version: "1.0.0",
    description: "Public enquiry, product, installation, careers, and CMS endpoints. Administrative APIs are not enabled until authentication is integrated.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Health" },
    { name: "Enquiries" },
    { name: "Products" },
    { name: "Installations" },
    { name: "Jobs" },
    { name: "Content" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API and database health",
        responses: {
          "200": { description: "API and database are available." },
          "503": { description: "A required dependency is unavailable." },
        },
      },
    },
    "/enquiries": {
      post: {
        tags: ["Enquiries"],
        summary: "Submit a website enquiry",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "interest", "message"],
                properties: {
                  name: { type: "string", maxLength: 120, description: "Name field used by the current React form." },
                  fullName: { type: "string", maxLength: 120, description: "Alternative name field for API clients." },
                  email: { type: "string", format: "email", maxLength: 254 },
                  phone: { type: "string", maxLength: 32 },
                  interest: { type: "string", enum: ["Home charger", "Commercial charger", "Consultation", "Maintenance & support", "Other"] },
                  message: { type: "string", minLength: 10, maxLength: 5000 },
                },
                anyOf: [{ required: ["name"] }, { required: ["fullName"] }],
              },
            },
          },
        },
        responses: {
          "201": { description: "Enquiry has been stored." },
          "400": { description: "Validation error." },
          "429": { description: "Rate limit exceeded." },
          "500": { description: "Unexpected server error." },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List published products",
        parameters: [
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
        ],
        responses: { "200": { description: "Published products and pagination metadata." } },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get a published product by UUID",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Published product." },
          "404": { description: "Product not found or not published." },
        },
      },
    },
    "/installation-requests": {
      post: {
        tags: ["Installations"],
        summary: "Submit an installation/site-assessment request",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "email", "phone", "installationType", "propertyType", "addressLine1", "city", "region", "postalCode", "country"],
                properties: {
                  fullName: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  installationType: { type: "string", enum: ["HOME", "COMMERCIAL"] },
                  propertyType: { type: "string", enum: ["HOUSE", "APARTMENT", "COMMERCIAL", "INDUSTRIAL", "OTHER"] },
                  addressLine1: { type: "string" },
                  addressLine2: { type: "string" },
                  city: { type: "string" },
                  region: { type: "string" },
                  postalCode: { type: "string" },
                  country: { type: "string" },
                  additionalRequirements: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Installation request has been stored." },
          "400": { description: "Validation error." },
          "429": { description: "Rate limit exceeded." },
        },
      },
    },
    "/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "List published jobs",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
        ],
        responses: { "200": { description: "Published jobs and pagination metadata." } },
      },
    },
    "/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get a published job by UUID",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Published job." }, "404": { description: "Job not found." } },
      },
    },
    "/jobs/applications": {
      post: {
        tags: ["Jobs"],
        summary: "Submit a text-based job application",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["jobId", "applicantName", "email", "phone"],
                properties: {
                  jobId: { type: "string", format: "uuid" },
                  applicantName: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  coverLetter: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Application was stored." },
          "400": { description: "Invalid application." },
        },
      },
    },
    "/content/pages": {
      get: {
        tags: ["Content"],
        summary: "List published CMS pages",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
        ],
        responses: { "200": { description: "Published pages and pagination metadata." } },
      },
    },
    "/content/pages/{slug}": {
      get: {
        tags: ["Content"],
        summary: "Get a published CMS page and ordered sections",
        parameters: [{ in: "path", name: "slug", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Published page." }, "404": { description: "Page not found." } },
      },
    },
  },
};
