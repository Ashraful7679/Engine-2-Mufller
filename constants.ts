
import { Product, Service, User } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Admin', role: 'admin', email: 'admin@autotrack.com', password: '1234' },
  { id: 'u2', name: 'Bob Manager', role: 'manager', email: 'manager@autotrack.com', password: '1234' },
];

export const SERVICE_CATEGORIES = [
  "General Services",
  "Repair Services",
  "Tyre & Wheel Services",
  "Electrical & Electronic Services",
  "Cleaning & Detailing Services",
  "Custom & Modification Services",
  "Safety & Comfort Services",
  "Diagnostic & Performance Services"
];

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities (Electric/Water)",
  "Salaries & Wages",
  "Spare Parts Purchase",
  "Tools & Equipment",
  "Marketing & Ads",
  "Tea & Refreshments",
  "Transportation",
  "Miscellaneous"
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Synthetic Motor Oil 5W-30',
    sku: 'OIL-SYN-530',
    type: 'product',
    category: 'Fluids',
    buyingPrice: 15.00,
    sellingPrice: 35.00,
    stock: 42,
  },
  {
    id: 'p2',
    name: 'Ceramic Brake Pads (Front)',
    sku: 'BRK-PAD-F-01',
    type: 'product',
    category: 'Brakes',
    buyingPrice: 25.00,
    sellingPrice: 65.00,
    stock: 12,
  },
  {
    id: 'p3',
    name: 'Oil Filter Premium',
    sku: 'FLT-OIL-PREM',
    type: 'product',
    category: 'Filters',
    buyingPrice: 4.50,
    sellingPrice: 12.00,
    stock: 8,
  },
  {
    id: 'p4',
    name: 'All-Season Tire 205/55R16',
    sku: 'TIRE-AS-16',
    type: 'product',
    category: 'Tires',
    buyingPrice: 60.00,
    sellingPrice: 110.00,
    stock: 20,
  }
];

// Helper to generate IDs
const s = (name: string, category: string): Service => ({
  id: `s_${name.replace(/\s+/g, '_').toLowerCase()}`,
  name,
  category,
  type: 'service'
});

export const INITIAL_SERVICES: Service[] = [
  // General Services
  s("Full Bike Servicing", "General Services"),
  s("Basic Servicing", "General Services"),
  s("Periodic Maintenance", "General Services"),
  s("Engine Oil Change", "General Services"),
  s("Oil Filter Change", "General Services"),
  s("Air Filter Cleaning / Replacement", "General Services"),
  s("Chain Adjustment & Lubrication", "General Services"),
  s("Brake Check & Adjustment", "General Services"),
  s("Clutch Adjustment", "General Services"),
  s("Coolant Check / Replacement", "General Services"),
  s("Battery Check & Charging", "General Services"),
  s("Spark Plug Cleaning / Replacement", "General Services"),
  s("Carburetor Cleaning", "General Services"),
  s("Fuel Injection (FI) System Check", "General Services"),
  s("Throttle Body Cleaning", "General Services"),

  // Repair Services
  s("Engine Repair", "Repair Services"),
  s("Gearbox Repair", "Repair Services"),
  s("Clutch Plate Replacement", "Repair Services"),
  s("Piston Ring Replacement", "Repair Services"),
  s("Valve Setting", "Repair Services"),
  s("Overhauling Engine", "Repair Services"),
  s("Brake Pad / Shoe Replacement", "Repair Services"),
  s("Disc Brake Repair", "Repair Services"),
  s("Suspension Repair", "Repair Services"),
  s("Shock Absorber Repair / Replacement", "Repair Services"),
  s("Electrical Wiring Repair", "Repair Services"),
  s("Starter Motor Repair", "Repair Services"),
  s("Self-Start System Repair", "Repair Services"),
  s("Fuel Pump Repair", "Repair Services"),
  s("Radiator Repair", "Repair Services"),

  // Tyre & Wheel
  s("Tyre Replacement", "Tyre & Wheel Services"),
  s("Tube Replacement", "Tyre & Wheel Services"),
  s("Wheel Alignment", "Tyre & Wheel Services"),
  s("Wheel Balancing", "Tyre & Wheel Services"),
  s("Rim Repair", "Tyre & Wheel Services"),
  s("Puncture Repair (Tubeless & Tube)", "Tyre & Wheel Services"),

  // Electrical
  s("Battery Replacement", "Electrical & Electronic Services"),
  s("Indicator / Headlight / Tail Light Replacement", "Electrical & Electronic Services"),
  s("Horn Repair / Replacement", "Electrical & Electronic Services"),
  s("Switch Repair", "Electrical & Electronic Services"),
  s("ECU (Engine Control Unit) Diagnostic", "Electrical & Electronic Services"),
  s("Digital Meter Repair", "Electrical & Electronic Services"),
  s("Wiring Harness Replacement", "Electrical & Electronic Services"),

  // Cleaning
  s("Full Bike Wash", "Cleaning & Detailing Services"),
  s("Engine Cleaning", "Cleaning & Detailing Services"),
  s("Foam Wash", "Cleaning & Detailing Services"),
  s("Polish & Wax", "Cleaning & Detailing Services"),
  s("Chain Cleaning & Lube", "Cleaning & Detailing Services"),
  s("Rust Removal", "Cleaning & Detailing Services"),
  s("Underbody Wash", "Cleaning & Detailing Services"),
  s("Ceramic Coating (Optional)", "Cleaning & Detailing Services"),
  s("Teflon Coating", "Cleaning & Detailing Services"),

  // Custom
  s("LED Light Installation", "Custom & Modification Services"),
  s("Custom Paint Job", "Custom & Modification Services"),
  s("Exhaust Modification", "Custom & Modification Services"),
  s("Seat Modification", "Custom & Modification Services"),
  s("Handlebar Adjustment / Replacement", "Custom & Modification Services"),
  s("Footrest Modification", "Custom & Modification Services"),
  s("Custom Horn Installation", "Custom & Modification Services"),

  // Safety
  s("Brake Fluid Change", "Safety & Comfort Services"),
  s("Handle Grip Replacement", "Safety & Comfort Services"),
  s("Tyre Pressure Check", "Safety & Comfort Services"),
  s("Suspension Tuning", "Safety & Comfort Services"),
  s("Mirror Replacement", "Safety & Comfort Services"),

  // Diagnostic
  s("Full Bike Health Check", "Diagnostic & Performance Services"),
  s("Computerized Diagnostic for FI Bikes", "Diagnostic & Performance Services"),
  s("Compression Test", "Diagnostic & Performance Services"),
  s("Engine Performance Tuning", "Diagnostic & Performance Services"),
  s("Mileage Check & Calibration", "Diagnostic & Performance Services"),
];
