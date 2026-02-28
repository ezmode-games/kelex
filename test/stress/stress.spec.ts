import { describe, expect, it } from "vitest";
import { generate } from "../../src/codegen/generator";
import { introspect } from "../../src/introspection";
import { writeSchema } from "../../src/schema-writer/writer";
import { evaluateSchemaCode } from "../helpers/evaluate-schema";

import { patientIntakeSchema } from "./01-healthcare-patient-intake";
import { productListingSchema } from "./02-ecommerce-product-listing";
import { loanApplicationSchema } from "./03-finance-loan-application";
import { jobApplicationSchema } from "./04-hr-job-application";
import { propertyListingSchema } from "./05-realestate-property-listing";
import { courseEnrollmentSchema } from "./06-education-course-enrollment";
import { shipmentBookingSchema } from "./07-logistics-shipment-booking";
import { contractIntakeSchema } from "./08-legal-contract-intake";
import { userSettingsSchema } from "./09-saas-user-settings";
import { claimsSubmissionSchema } from "./10-insurance-claims-submission";
import { taxFilingSchema } from "./11-government-tax-filing";

interface SchemaTestCase {
  name: string;
  schema: unknown;
  expectedHardFeatures: string[];
}

const schemas: SchemaTestCase[] = [
  {
    name: "01 Healthcare: Patient Intake",
    schema: patientIntakeSchema,
    expectedHardFeatures: ["nested object (address)"],
  },
  {
    name: "02 E-commerce: Product Listing",
    schema: productListingSchema,
    expectedHardFeatures: [
      "nested object (price)",
      "array (tags, images)",
      "discriminated union (attributes)",
    ],
  },
  {
    name: "03 Finance: Loan Application",
    schema: loanApplicationSchema,
    expectedHardFeatures: [
      "discriminated union (loanDetails)",
      ".check() on root",
    ],
  },
  {
    name: "04 HR: Job Application",
    schema: jobApplicationSchema,
    expectedHardFeatures: [
      "array of objects (education, workExperience)",
      "array of strings (skills)",
      "nullable optional URL",
    ],
  },
  {
    name: "05 Real Estate: Property Listing",
    schema: propertyListingSchema,
    expectedHardFeatures: [
      "intersection (.and())",
      "deeply nested object (address inside location)",
      "array (amenities)",
    ],
  },
  {
    name: "06 Education: Course Enrollment",
    schema: courseEnrollmentSchema,
    expectedHardFeatures: [
      "tuple (semester)",
      "record (preferences)",
      "array of objects (courses)",
    ],
  },
  {
    name: "07 Logistics: Shipment Booking",
    schema: shipmentBookingSchema,
    expectedHardFeatures: [
      "discriminated union (shippingMethod)",
      "nested objects (addresses)",
      "array of objects (packages)",
    ],
  },
  {
    name: "08 Legal: Contract Intake",
    schema: contractIntakeSchema,
    expectedHardFeatures: ["branded type (CaseNumber)", "nullish fields"],
  },
  {
    name: "09 SaaS: User Settings",
    schema: userSettingsSchema,
    expectedHardFeatures: [
      "nested object (notifications)",
      "record (featureFlags)",
    ],
  },
  {
    name: "10 Insurance: Claims Submission",
    schema: claimsSubmissionSchema,
    expectedHardFeatures: [
      "nested object (claimant with nested address)",
      "discriminated union (claimDetails)",
      "array of objects (documents)",
    ],
  },
  {
    name: "11 Government: Tax Filing",
    schema: taxFilingSchema,
    expectedHardFeatures: [
      ".check() cross-field validation",
      "nested object (address, bankAccount, itemizedDeductions)",
      "array of discriminated unions (incomeSources)",
      "array of objects (dependents)",
      "conditional required fields",
    ],
  },
];

const INTROSPECT_OPTS = {
  formName: "TestForm",
  schemaImportPath: "./schema",
  schemaExportName: "testSchema",
};

describe("Stress test: complex Zod v4 schemas", () => {
  for (const testCase of schemas) {
    describe(testCase.name, () => {
      it("should generate a form", () => {
        const opts = {
          schema: testCase.schema as Parameters<typeof generate>[0]["schema"],
          formName: `${testCase.name.replace(/[^a-zA-Z]/g, "")}Form`,
          schemaImportPath: "./schema",
          schemaExportName: "schema",
        };

        const result = generate(opts);

        expect(result.fields.length).toBeGreaterThan(0);

        console.log(`[CODEGEN] ${testCase.name}`);
        console.log(`  Fields: ${result.fields.join(", ")}`);
        if (result.warnings.length > 0) {
          console.log(`  Warnings: ${result.warnings.join("; ")}`);
        }
        console.log(
          `  Hard features: ${testCase.expectedHardFeatures.join(", ")}`,
        );
      });

      it("should round-trip through schema writer", () => {
        const descriptor1 = introspect(
          testCase.schema as Parameters<typeof introspect>[0],
          INTROSPECT_OPTS,
        );

        const { code } = writeSchema({ form: descriptor1 });
        const roundTrippedSchema = evaluateSchemaCode(code);
        const descriptor2 = introspect(roundTrippedSchema, INTROSPECT_OPTS);

        // Field count must match
        expect(descriptor2.fields).toHaveLength(descriptor1.fields.length);

        // Each field: name and type must match
        for (let i = 0; i < descriptor1.fields.length; i++) {
          const f1 = descriptor1.fields[i];
          const f2 = descriptor2.fields[i];
          expect(f2.name).toBe(f1.name);
          expect(f2.type).toBe(f1.type);
        }

        console.log(`[ROUND-TRIP] ${testCase.name}`);
        console.log(
          `  Fields: ${descriptor1.fields.map((f) => f.name).join(", ")}`,
        );
        console.log(`  Field count: ${descriptor1.fields.length}`);
      });
    });
  }
});
