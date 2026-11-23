import { brand } from "../data/brandData";

export default function Logo({ showName = false }) {
  const l = brand.logo;

  return (
    <a href="#home" className="logo-link" aria-label="ScarfaceEV home">
      <img src={l.onDark || l.light} alt={l.alt} height="44" />
    </a>
  );
}
