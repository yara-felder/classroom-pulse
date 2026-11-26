import React from "react";
import { Link } from "react-router-dom";
import { LegalSection, PublicPage } from "@/components/PublicPage";

export default function TermsPage() {
  return (
    <PublicPage
      testId="terms-page"
      kicker="Effective Date: November 15, 2026"
      title="Terms of Service for WrenRoom"
    >
      <LegalSection title="1. Who these terms cover">
        <p>
          These terms are the agreement between you and WrenRoom. They apply to educators and
          to schools using WrenRoom, including pilot schools. By creating an account or using
          the service, you agree to these terms and to the{" "}
          <Link to="/privacy" className="font-semibold text-teal-700 hover:text-teal-800">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Authorized school and educator use">
        <p>
          WrenRoom is for schools and their authorized educators: Classroom Teachers, Case
          Managers and Specialists, and School Administrators. Use an account only for classroom
          management and positive behavior recognition, and keep your login to yourself.
        </p>
        <p>
          Schools and School Administrators are responsible for provisioning, assigning, and revoking
          access for Teachers and Case Managers or Specialists based on a legitimate educational
          interest.
        </p>
        <p>
          Case Managers, Specialists, and Teachers agree to access and use student records solely
          within the scope of their assigned classrooms or caseloads, and in accordance with their
          school’s FERPA and student privacy policies.
        </p>
      </LegalSection>

      <LegalSection title="3. Rosters and required consents">
        <p>
          You, or your school, are responsible for having the authority to add a classroom roster and
          for obtaining any school or parental consents your policies require before you enter student
          information or send progress digests to a parent or guardian. Enter only the student
          information you are allowed to share with a school service provider.
        </p>
      </LegalSection>

      <LegalSection title="4. Intellectual property">
        <p>
          WrenRoom, including the software, name, and logo, belongs to WrenRoom. You
          keep ownership of the classroom content you enter. You give WrenRoom a limited
          permission to host and process that content only so we can provide the service to you and
          your school.
        </p>
      </LegalSection>

      <LegalSection title="5. Pilots and availability">
        <p>
          During a pilot, the service is provided as it is available. Features may change, and access
          may be paused or end. We will try to tell participating schools before a planned
          interruption. Keep your own copy of any records your school must retain. WrenRoom is
          not your school’s official student information system.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Questions about these terms can go to{" "}
          <a href="mailto:support@classroompulse.net" className="font-semibold text-teal-700 hover:text-teal-800">
            support@classroompulse.net
          </a>
          .
        </p>
      </LegalSection>
    </PublicPage>
  );
}
