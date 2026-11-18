import React from "react";
import { LegalSection, PublicPage } from "@/components/PublicPage";

export default function PrivacyPage() {
  return (
    <PublicPage
      testId="privacy-page"
      kicker="Effective Date: November 15, 2026"
      title="Privacy Policy for Classroom Pulse"
    >
      <LegalSection title="1. Overview and role">
        <p>
          Classroom Pulse is a classroom management and positive behavior recognition platform
          operated independently for K–12 educators. When a school or district uses Classroom Pulse,
          we act as a School Official. We process student data strictly on behalf of and under the
          direction of the school, in line with the Family Educational Rights and Privacy Act (FERPA)
          and the Children’s Online Privacy Protection Act (COPPA).
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect and Google user data">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Teacher account and Google sign-in</h3>
          <p className="mt-1">
            When educators sign in with Google, we access only basic profile information: name, email
            address, and profile avatar. We request this through the standard OpenID scopes{" "}
            <span className="font-medium text-slate-700">email</span>,{" "}
            <span className="font-medium text-slate-700">profile</span>, and{" "}
            <span className="font-medium text-slate-700">openid</span>, and we use it solely to
            authenticate and manage the teacher account.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Classroom and student data</h3>
          <p className="mt-1">
            Teachers may enter student display names or initials, classroom rosters, behavior and
            point logs, and optional parent or guardian email addresses for progress digests. Student
            avatars are generated locally inside the app. Student names are not sent to external
            avatar services.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="3. Role-based access and legitimate educational interest">
        <p>
          Classroom Pulse limits student records by role. Access is enforced with role-based access
          controls aligned with FERPA’s School Official exception and legitimate educational interest
          standard, so staff see only the records their educational duties require.
        </p>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Classroom Teachers</h3>
          <p className="mt-1">
            Classroom Teachers can view and manage only their own classroom rosters, behavior and
            point logs, and parent digest communications.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Case Managers and Specialists</h3>
          <p className="mt-1">
            Case Managers and Specialists, including special education staff, behavior specialists,
            and counselors, have scoped access limited strictly to the students assigned to their
            caseload or support group.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">School Administrators</h3>
          <p className="mt-1">
            School Administrators have school-wide administrative oversight to manage educator roles,
            onboard and offboard staff, review aggregate engagement, and export or permanently delete
            student and school records.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="4. How we use and share data">
        <p>
          We use this information solely to operate and improve Classroom Pulse for teachers, schools,
          and families. We do not sell personal or student data. We do not use it for targeted
          advertising. We do not share it with third-party data brokers or with generalized AI
          training models.
        </p>
        <p>
          Data is processed only by the infrastructure needed to run the service: Supabase for the
          encrypted database and authentication, Vercel for hosting, and Resend for parent email
          digests. Those providers handle data under data protection agreements.
        </p>
      </LegalSection>

      <LegalSection title="5. Data security, retention, and deletion">
        <p>
          Data is encrypted in transit with TLS and encrypted at rest. Teachers and school
          administrators can export or permanently delete classroom and student records at any time.
          To delete an entire account and its data, email{" "}
          <a href="mailto:support@classroompulse.net" className="font-semibold text-teal-700 hover:text-teal-800">
            support@classroompulse.net
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Questions about this policy can go to{" "}
          <a href="mailto:support@classroompulse.net" className="font-semibold text-teal-700 hover:text-teal-800">
            support@classroompulse.net
          </a>
          .
        </p>
      </LegalSection>
    </PublicPage>
  );
}
