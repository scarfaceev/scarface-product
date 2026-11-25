import Header from "./components/Header";
import Footer from "./components/Footer";
import Overlays from "./components/Overlays";
import Home from "./pages/Home";
export default function App() {
  const servicePage = window.location.pathname.replace(/\/+$/, "");
  if (servicePage === "/site-inspection" || servicePage === "/document-assistance") {
    return <main className="service-blank" aria-label={servicePage === "/site-inspection" ? "Site Inspection" : "Document Assistance"} />;
  }

  return (<><Header /><Home /><Footer /><Overlays /></>);
}
