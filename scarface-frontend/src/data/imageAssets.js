import dcChargerFront from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/DC_front.png";
import dcChargerRear from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/DC_back.png";
import dcChargerSideAngle from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/DC_slim.png";
import dcChargerThreeQuarter from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/DC.png";
import dcChargerTwo from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/DC (2).png";
import dcChargerSlimTwo from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/DC_Slim2.png";
import aboutChargerScene from "../assets/images/about-charger-scene.png";

// EVERY image on the site is configured here. Set `src` to a local file (import or /public path) or a URL.
// src: null => built-in illustration. mobileSrc is optional. Keep credits in ATTRIBUTION.md.
const i = (alt, hue, extra = {}) => ({ src: null, mobileSrc: null, alt, hue, ...extra });
const photo = (alt, src) => ({ src, mobileSrc: null, alt, hue: 168 });
export const images = {
  hero: i("Illustrative render of an electric car connected to a wall-mounted ScarfaceEV charger", 170, { scene: "hero" }),
  home: i("EV charging at home", 200), services: i("Charger installation", 160), about: photo("ScarfaceEV charger at a scenic EV charging station", aboutChargerScene),
  chargers: photo("ScarfaceEV DC fast charger, front view", dcChargerFront), contact: i("Customer support", 150), product: photo("ScarfaceEV DC fast charger, DC2 view", dcChargerTwo),
  landscape: i("Aerial view of a mountain valley", 150, { scene: "landscape" }), why: i("Premium charging environment", 178), energy: i("Home energy and EV charging", 140),
  g1: photo("ScarfaceEV DC fast charger, front view", dcChargerFront),
  g2: photo("ScarfaceEV DC fast charger, front three-quarter view", dcChargerThreeQuarter),
  g3: photo("ScarfaceEV DC fast charger, side angle", dcChargerSideAngle),
  g4: photo("ScarfaceEV DC fast charger, rear view", dcChargerRear),
  g5: photo("ScarfaceEV DC fast charger, DC2 view", dcChargerTwo),
  g6: photo("ScarfaceEV DC fast charger, slim side view", dcChargerSlimTwo),
  b1: i("EV charging technology", 165), b2: i("Home EV charging", 195), b3: i("Smart energy management", 150),
};

export const chargerModels = [
  {
    id: "dc-fast",
    name: "DC Fast Charger",
    views: [
      { src: dcChargerFront, label: "Front", angle: "Front" },
      { src: dcChargerThreeQuarter, label: "Front three-quarter", angle: "Three-quarter" },
      { src: dcChargerSideAngle, label: "Side angle", angle: "Side" },
      { src: dcChargerRear, label: "Rear", angle: "Back" },
    ],
  },
];
