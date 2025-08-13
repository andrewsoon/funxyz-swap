import type React from "react";
import "./Modal.css"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null
  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <span className="modal-close" onClick={onClose}>
          &times;
        </span>
        {children}
      </div>
    </div>
  )
}

export default Modal