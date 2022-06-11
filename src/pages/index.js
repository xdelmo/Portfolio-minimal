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
        <ProjectsSection sectionId="projects" heading="Spulcia i Progetti 👨‍💻" />
        <InterestsSection
          sectionId="details"
          heading="Competenze e Strumenti 📋"
        />
        <AboutSection sectionId="about" heading="Chi Sono 🗿" />
        <ContactSection sectionId="contact" heading="Domande ❓" />
      </Page>
    </>
  );
}
