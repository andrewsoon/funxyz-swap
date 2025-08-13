import type React from "react"
import "./Footer.css"
import { StaticLinks } from "../constants/links"

const Footer: React.FC = () => {
  return (
    <div className="footer-wrapper">
      <p className="footer-copyright">© 2025 The Fun Group, Inc.</p>
      <div className="footer-links-wrapper">
        <a href={StaticLinks.Twitter} target="_blank">
          Twitter
        </a>
        <a href={StaticLinks.LinkedIn} target="_blank">
          LinkedIn
        </a>
        <a href={StaticLinks.Careers} target="_blank">
          Careers
        </a>
        <a href={StaticLinks.PrivacyPolicy} target="_blank">
          Privacy
        </a>
        <a href={StaticLinks.Terms} target="_blank">
          Terms
        </a>
      </div>
    </div>
  )
}

export default Footer