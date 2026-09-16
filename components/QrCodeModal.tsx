"use client";

import { useState } from "react";
import { X, ExternalLink, Copy, Check } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
}

export default function QrCodeModal({ isOpen, onClose, url }: QrCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const targetUrl =
    url ||
    (typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/portfolio`
      : "https://adarsh-portfolio.web.app/portfolio");

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate a clean quick QR code via Google Chart API or SVG
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(targetUrl)}&bgcolor=060913&color=a78bfa&margin=1`;

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div>
            <h3>Share Public Portfolio</h3>
            <small>Instant recruiter mobile preview</small>
          </div>
          <button className="qr-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="qr-code-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImageUrl} alt="Portfolio QR Code" width={220} height={220} className="qr-image" />
          <span className="qr-scan-hint">Scan with camera to open on mobile</span>
        </div>

        <div className="qr-url-box">
          <input readOnly value={targetUrl} />
          <button onClick={handleCopy} className="qr-copy-btn">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="qr-modal-footer">
          <a href={targetUrl} target="_blank" className="qr-open-btn">
            Open in new tab <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
