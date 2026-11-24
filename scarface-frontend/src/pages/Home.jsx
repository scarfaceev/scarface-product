import { lazy, Suspense } from "react";
import Hero from "../components/Hero";
import { ProductShowcase, Features, AppShowcase, WhyChoose, Installation, ProductGallery, Datasheet, FAQ, FinalCTA, ContactSection, About, Sustainability } from "../components/Sections";
const Product3DViewer = lazy(() => import("../components/Product3DViewer"));
export default function Home() {
  return (<main>
    <Hero /><ProductShowcase />
    <Suspense fallback={null}><Product3DViewer /></Suspense>
    <Datasheet /><Features /><AppShowcase /><Sustainability />
    <WhyChoose /><Installation /><ProductGallery /><About /><FAQ /><FinalCTA /><ContactSection />
  </main>);
}
