// img = key in imageAssets.js; spy = section ids that highlight this item while scrolling.
export const nav = [
  { label: "Home", img: "home", spy: ["home"], title: "Welcome to ScarfaceEV", desc: "Smarter charging for every journey.", cta: ["Explore chargers", "#chargers"], links: [["Home overview", "#home"]] },
  { label: "Chargers", img: "chargers", spy: ["chargers", "viewer", "features", "app"], title: "Our chargers", desc: "Explore our EV charging solutions.", cta: ["Explore chargers", "#chargers"], links: [ ["Every angle", "#viewer"], ["Features", "#features"], ["Mobile app", "#app"]] },
  { label: "Sustainable", img: "sustainability", spy: ["sustainability", "why"], title: "Sustainable mobility", desc: "Cleaner charging and transport.", cta: ["Why ScarfaceEV", "#why"], links: [["Sustainable mobility", "#sustainability"], ["Why choose us", "#why"]] },
  { label: "Services", img: "services", spy: ["services", "installation"], title: "Installation & support", desc: "From first conversation to handover.", cta: ["See the process", "#installation"], links: [["Installation journey", "#installation"], ["Consultation", "#contact"]] },
  { label: "Gallery", img: "gallery", spy: ["gallery"], title: "Product gallery", desc: "View charger photographs.", cta: ["Open gallery", "#gallery"], links: [["Product gallery", "#gallery"]] },
  { label: "About", img: "about", spy: ["about"], title: "About ScarfaceEV", desc: "Technology-driven and customer-focused.", cta: ["About ScarfaceEV", "#about"], links: [["About ScarfaceEV", "#about"]] },
  { label: "Contact", img: "contact", spy: ["contact", "cta"], title: "Talk to our team", desc: "Quotes, consultations and support.", cta: ["Request a quote", "#contact"], links: [["Contact information", "#contact"]] },
];
