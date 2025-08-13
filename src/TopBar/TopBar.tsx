import type React from "react";
import FunSVG from '../assets/Fun.svg'
import { StaticLinks } from "../constants/links";
import "./TopBar.css"

const TopBar: React.FC = () => {
  return (
    <div className="topbar-wrapper">
      <img src={FunSVG} className="topbar-logo" />
      <button onClick={() => window.open(StaticLinks.GoogleForm, '_blank')} >Get in touch</button>
    </div>
  )
}

export default TopBar