"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";

interface MagicButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function MagicButton({ href, children, className = "", style }: MagicButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate tilt
    const tiltX = ((y - centerY) / centerY) * -8;
    const tiltY = ((x - centerX) / centerX) * 8;

    // Calculate magnetic pull (subtle movement towards cursor)
    const magnetX = (x - centerX) * 0.1;
    const magnetY = (y - centerY) * 0.1;

    // Update CSS custom properties for glow position
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    button.style.setProperty("--mouse-x", `${percentX}%`);
    button.style.setProperty("--mouse-y", `${percentY}%`);
    button.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate(${magnetX}px, ${magnetY}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    button.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translate(0px, 0px)";
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create ripple element
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = "30px";
    ripple.style.height = "30px";
    ripple.style.marginLeft = "-15px";
    ripple.style.marginTop = "-15px";

    button.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }, []);

  return (
    <Link
      ref={buttonRef}
      href={href}
      className={`magic-button ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}

