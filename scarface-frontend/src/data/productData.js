const TBC = "To be confirmed";
export const products = [{
  id: "model-1", category: "Tall charger", name: "ScarfaceEV Tall Charger",
  desc: "A premium charger designed for simple, dependable everyday charging. Product description to be supplied.",
  points: ["Key advantage one – to be confirmed", "Key advantage two – to be confirmed", "Key advantage three – to be confirmed"],
  cta: ["Enquire about this charger", "#contact"], img: "product",
  model3d: null,   // e.g. new URL("../assets/models/charger.glb", import.meta.url).href  (GLB/GLTF)
  datasheet: null, // e.g. "./datasheet.pdf" placed in /public – the section is hidden until set
  specs: { "Charging power": TBC, "Charging type (AC / DC)": TBC, "Input voltage": TBC, "Output voltage": TBC, "Connector type": TBC, "Connectivity": TBC, "Protection rating": TBC, "Operating temperature": TBC, "Installation type": TBC, "Cable length": TBC },
}];
// Add a second product above and the Comparison section appears automatically.
