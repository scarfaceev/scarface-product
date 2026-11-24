import logoLight from "../assets/logo/logo-removebg-preview.png";
import instagramIcon from "../assets/social/instagram.png";
import linkedinIcon from "../assets/social/linkedin.png";
import youtubeIcon from "../assets/social/youtube.png";
// Replace src/assets/logo/logo-removebg-preview.png, or add a transparent light-on-dark version as `onDark`.
export const brand = {
  name: "ScarfaceEV", tagline: "Build In Silence. Driven By Power",
  about: "Scarface EV Solutions is a Hyderabad-based EV charging solutions company providing reliable and innovative charging systems for residential, commercial, and public infrastructure. Our solutions include AC chargers, DC fast chargers, and home charging systems, driving smarter mobility and a sustainable future.",
  logo: { light: logoLight, onDark: null, alt: "ScarfaceEV Solutions logo" },
  contact: { email: " email – Info@scarfaceev.com ", phone: " phone – 8790009063 ", address: " address – Warangal Highway, Medchal Malkajgiri,Hyderabad - 500088 " },
  social: [
    { label: "Instagram", href: "#", icon: instagramIcon },
    { label: "LinkedIn", href: "#", icon: linkedinIcon },
    { label: "YouTube", href: "#", icon: youtubeIcon },
  ],
  hero: { title: ["Build In Silence", "Driven By Power"], text: "ScarfaceEV designs intelligent EV charging solutions for homes and businesses – built to make every journey simpler, smarter and more convenient." },
  cta: { title: "Ready to Charge Smarter?", text: "Explore intelligent charging solutions with ScarfaceEV and take the next step toward a smarter electric future." },
  interests: ["Home charger", "Commercial charger", "Consultation", "Maintenance & support", "Other"],
};
