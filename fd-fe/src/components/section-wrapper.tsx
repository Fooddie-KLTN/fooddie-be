import React from "react";

interface SectionWrapperProps
  extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  children,
  className,
  ...props
}) => (
  <section {...props} className={`py-4 ${className || ""}`}>
    {children}
  </section>
);

export default SectionWrapper;
