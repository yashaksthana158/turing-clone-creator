import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { VisionSection } from "@/components/VisionSection";
import { RoleSection } from "@/components/RoleSection";
import { RegistrationsSection } from "@/components/RegistrationsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div>
      <Navigation />
      <HeroSection />
      <VisionSection />
      <RoleSection />
      <RegistrationsSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default Index;
