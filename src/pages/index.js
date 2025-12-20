import React from "react";
import {
  AboutSection,
  ContactSection,
  HeroSection,
  InterestsSection,
  Page,
  ProjectsSection,
  Seo,
} from "gatsby-theme-portfolio-minimal";

export default function IndexPage() {
  return (
    <>
      <Seo title="Emanuele Del Monte Portfolio" />
      <Page useSplashScreenAnimation>
        <HeroSection sectionId="hero" />
        <ProjectsSection sectionId="projects" heading="Spulcia i progetti 👨‍💻" />
        <InterestsSection
          sectionId="details"
          heading="Competenze e strumenti 📋"
        />
        <AboutSection sectionId="about" heading="Chi sono 🗿" />
        <ContactSection sectionId="contact" heading="Mettiamoci in contatto 🤝" />
      </Page>
    </>
  );
}
