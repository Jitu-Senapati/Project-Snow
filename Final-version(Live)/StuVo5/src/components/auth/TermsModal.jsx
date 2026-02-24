import React from "react";

const TermsModal = ({ show, onClose, onAccept }) => {
  if (!show) return null;

  return (
    <div className="terms-modal show" id="termsModal">
      <div className="terms-content">
        <div className="terms-header">
          <h2>Terms and Conditions</h2>
          <span className="close-terms" onClick={onClose}>
            &times;
          </span>
        </div>
        <div className="terms-body">
          <h3>1. Introduction</h3>
          <p>
            STUVO5 is a student-focused academic project developed to provide
            access to college-related information such as marks, attendance,
            events, announcements, and student services. By using this
            application, you agree to the following terms.
          </p>

          <h3>2. Eligibility</h3>
          <p>
            STUVO5 is intended for enrolled college students. By registering,
            you confirm that you are a current or prospective student and that
            the information you provide is accurate and truthful.
          </p>

          <h3>3. User Responsibility</h3>
          <p>
            Users are responsible for maintaining the confidentiality of their
            login credentials. Account sharing is not permitted. Any activity
            performed through an account is the responsibility of the account
            holder.
          </p>

          <h3>4. Data Usage</h3>
          <p>
            The application may collect academic details (such as marks and
            attendance), basic profile information, and usage data to provide
            and improve student services. STUVO5 does not sell or use student
            data for commercial purposes.
          </p>

          <h3>5. Privacy & Security</h3>
          <p>
            Reasonable measures are taken to protect user data. However, as this
            is an academic project, complete data security cannot be guaranteed.
          </p>

          <h3>6. Acceptable Use</h3>
          <p>
            Users must use the platform responsibly. Posting abusive, illegal,
            or misleading content, or attempting unauthorized access to data,
            may result in account suspension.
          </p>

          <h3>7. Academic Disclaimer</h3>
          <p>
            STUVO5 is not an official college system. All academic information
            is for reference purposes only. Students should verify official
            records with the college administration.
          </p>

          <h3>8. Changes to the Application</h3>
          <p>
            Features and terms may be updated or modified as part of project
            development. Continued use of the application indicates acceptance
            of any updates.
          </p>

          <h3>9. Non-Commercial Project</h3>
          <p>
            STUVO5 is developed solely for academic purposes and is not intended
            for commercial use.
          </p>

          <h3>10. Acceptance</h3>
          <p>
            By creating an account or using STUVO5, users confirm that they have
            read and agreed to these Terms and Conditions.
          </p>
        </div>
        <div className="terms-footer">
          <button className="accept-terms" id="acceptTerms" onClick={onAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
