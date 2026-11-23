import tallChargerFront from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/1.png";
import wallChargerCorner from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/2.png";
import wallChargerFront from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/3.png";
import wallChargerRear from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/4.png";
import wallChargerSide from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/5.png";
import tallChargerAlternate from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/6.png";
import wallChargerCable from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/7.png";
import tallChargerRear from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/8.png";
import tallChargerCorner from "../assets/images/charger-photos/SCARFACEEV Tall Charger Front (1)/9.png";

// EVERY image on the site is configured here. Set `src` to a local file (import or /public path) or a URL.
// src: null => built-in illustration. mobileSrc is optional. Keep credits in ATTRIBUTION.md.
const i = (alt, hue, extra = {}) => ({ src: null, mobileSrc: null, alt, hue, ...extra });
const photo = (alt, src) => ({ src, mobileSrc: null, alt, hue: 168 });
export const images = {
  hero: i("Illustrative render of an electric car connected to a wall-mounted ScarfaceEV charger", 170, { scene: "hero" }),
  home: i("EV charging at home", 200), services: i("Charger installation", 160), about: i("EV technology", 185),
  chargers: i("Charger product", 172), contact: i("Customer support", 150), product: photo("ScarfaceEV tall charger, front view", tallChargerFront),
  landscape: i("Aerial view of a mountain valley", 150, { scene: "landscape" }), why: i("Premium charging environment", 178), energy: i("Home energy and EV charging", 140),
  g1: photo("Tall charger, front view", tallChargerFront),
  g2: photo("Tall charger, front three-quarter view", tallChargerCorner),
  g3: photo("Tall charger, rear view", tallChargerRear),
  g4: photo("Wall charger, front view", wallChargerFront),
  g5: photo("Wall charger, side view", wallChargerSide),
  g6: photo("Wall charger, rear view", wallChargerRear),
  b1: i("EV charging technology", 165), b2: i("Home EV charging", 195), b3: i("Smart energy management", 150),
};

export const chargerModels = [
  {
    id: "tall",
    name: "Tall Charger",
    views: [
      { src: tallChargerFront, label: "Front", angle: "Front" },
      { src: tallChargerCorner, label: "Front three-quarter", angle: "Side" },
      { src: tallChargerRear, label: "Rear", angle: "Back" },
      { src: tallChargerAlternate, label: "Alternate front" },
    ],
  },
  {
    id: "wall",
    name: "Wall Charger",
    views: [
      { src: wallChargerFront, label: "Front", angle: "Front" },
      { src: wallChargerSide, label: "Side", angle: "Side" },
      { src: wallChargerRear, label: "Rear", angle: "Back" },
      { src: wallChargerCorner, label: "Front three-quarter" },
      { src: wallChargerCable, label: "Charger and cable" },
    ],
  },
];
