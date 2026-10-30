/**
 * Fictional people for the demo. Every name, bio, phone number and salary figure is invented.
 * Emails use the reserved `.example` TLD; phone numbers are obviously synthetic sequences.
 */
import { DEMO_EMAIL_DOMAIN } from "@/config/demo-accounts";
import type { StaffKey } from "./catalogue";

export interface Weekly {
  /** ISO weekdays this person works (Monday is the salon's closed day). */
  days: number[];
  start: string;
  end: string;
  /** Optional different Sunday window. */
  sundayStart?: string;
  sundayEnd?: string;
}

export interface StaffSeed {
  key: StaffKey | "priya" | "karan" | "neha";
  name: string;
  email: string;
  phone: string;
  roleKey: "stylist" | "employee" | "manager" | "assistant_manager" | "senior_manager";
  code: string;
  jobTitle: string;
  bio: string;
  specialties: string[];
  skillCategories: string[];
  languages: string[];
  years: number;
  employmentType: "FULL_TIME" | "PART_TIME";
  startDate: string;
  bookable: boolean;
  featured: boolean;
  weekly: Weekly;
  baseSalary: number;
  fixedAllowance: number;
  status?: "ACTIVE" | "INACTIVE";
}

const email = (first: string, last: string) => `${first}.${last}@${DEMO_EMAIL_DOMAIN}`.toLowerCase();

export const STYLISTS: StaffSeed[] = [
  {
    key: "aarav",
    name: "Aarav Menon",
    email: email("aarav", "menon"),
    phone: "+91 90000 10001",
    roleKey: "stylist",
    code: "SFS-E001",
    jobTitle: "Senior Stylist",
    bio: "Sample bio — Aarav is known for patient consultations and cuts that grow out well. He enjoys working with both short crops and long layers.",
    specialties: ["Precision cuts", "Men's & women's styling", "Family appointments"],
    skillCategories: ["haircuts-styling", "grooming", "kids-family"],
    languages: ["English", "Hindi", "Malayalam"],
    years: 9,
    employmentType: "FULL_TIME",
    startDate: "2021-02-01",
    bookable: true,
    featured: true,
    weekly: { days: [2, 3, 4, 5, 6], start: "10:00", end: "19:00" },
    baseSalary: 42000,
    fixedAllowance: 3000,
  },
  {
    key: "meera",
    name: "Meera Kapoor",
    email: email("meera", "kapoor"),
    phone: "+91 90000 10002",
    roleKey: "employee",
    code: "SFS-E002",
    jobTitle: "Colour Specialist",
    bio: "Sample bio — Meera designs colour around your base shade and maintenance appetite, from soft gloss to hand-painted balayage.",
    specialties: ["Balayage", "Colour correction", "Glossing"],
    skillCategories: ["colour-treatments", "haircuts-styling"],
    languages: ["English", "Hindi", "Punjabi"],
    years: 11,
    employmentType: "FULL_TIME",
    startDate: "2020-08-17",
    bookable: true,
    featured: true,
    weekly: { days: [2, 3, 4, 5, 6], start: "11:00", end: "20:00" },
    baseSalary: 48000,
    fixedAllowance: 3500,
  },
  {
    key: "zoya",
    name: "Zoya Sheikh",
    email: email("zoya", "sheikh"),
    phone: "+91 90000 10003",
    roleKey: "stylist",
    code: "SFS-E003",
    jobTitle: "Bridal & Makeup Artist",
    bio: "Sample bio — Zoya plans bridal mornings down to the minute, from trial to touch-ups, and loves natural, camera-ready skin.",
    specialties: ["Bridal makeup", "Occasion hair", "Saree draping"],
    skillCategories: ["bridal-occasion", "skin-facials"],
    languages: ["English", "Hindi", "Urdu"],
    years: 8,
    employmentType: "FULL_TIME",
    startDate: "2021-06-14",
    bookable: true,
    featured: true,
    weekly: { days: [3, 4, 5, 6, 7], start: "10:00", end: "19:00", sundayStart: "11:00", sundayEnd: "18:00" },
    baseSalary: 55000,
    fixedAllowance: 4000,
  },
  {
    key: "rohan",
    name: "Rohan Desai",
    email: email("rohan", "desai"),
    phone: "+91 90000 10004",
    roleKey: "employee",
    code: "SFS-E004",
    jobTitle: "Barber & Groomer",
    bio: "Sample bio — Rohan’s chair is calm, quick and exact: clean fades, scissor work and beard lines that last the week.",
    specialties: ["Fades & scissor cuts", "Beard sculpting", "Kids' cuts"],
    skillCategories: ["grooming", "haircuts-styling", "kids-family"],
    languages: ["English", "Hindi", "Gujarati"],
    years: 7,
    employmentType: "FULL_TIME",
    startDate: "2022-01-10",
    bookable: true,
    featured: false,
    weekly: { days: [2, 3, 4, 5, 6, 7], start: "10:00", end: "19:00", sundayStart: "11:00", sundayEnd: "18:00" },
    baseSalary: 36000,
    fixedAllowance: 2500,
  },
  {
    key: "ananya",
    name: "Ananya Rao",
    email: email("ananya", "rao"),
    phone: "+91 90000 10005",
    roleKey: "employee",
    code: "SFS-E005",
    jobTitle: "Skin Therapist",
    bio: "Sample bio — Ananya builds each facial around what your skin needs that week, and explains every product she uses.",
    specialties: ["Facials", "Brows & threading", "Skin consultations"],
    skillCategories: ["skin-facials"],
    languages: ["English", "Hindi", "Kannada"],
    years: 6,
    employmentType: "FULL_TIME",
    startDate: "2022-05-02",
    bookable: true,
    featured: true,
    weekly: { days: [2, 3, 4, 5, 6], start: "10:00", end: "19:00" },
    baseSalary: 40000,
    fixedAllowance: 3000,
  },
  {
    key: "kabir",
    name: "Kabir Malhotra",
    email: email("kabir", "malhotra"),
    phone: "+91 90000 10006",
    roleKey: "employee",
    code: "SFS-E006",
    jobTitle: "Stylist",
    bio: "Sample bio — Kabir is the friendliest face for first haircuts and for anyone who just wants a tidy, modern look.",
    specialties: ["Modern cuts", "Kids' haircuts", "Blow-dry styling"],
    skillCategories: ["haircuts-styling", "kids-family", "grooming"],
    languages: ["English", "Hindi"],
    years: 3,
    employmentType: "FULL_TIME",
    startDate: "2024-03-04",
    bookable: true,
    featured: false,
    weekly: { days: [2, 3, 4, 5, 6, 7], start: "10:00", end: "19:00", sundayStart: "11:00", sundayEnd: "18:00" },
    baseSalary: 28000,
    fixedAllowance: 2000,
  },
  {
    key: "ishita",
    name: "Ishita Nair",
    email: email("ishita", "nair"),
    phone: "+91 90000 10007",
    roleKey: "employee",
    code: "SFS-E007",
    jobTitle: "Nail Artist",
    bio: "Sample bio — Ishita’s prep is meticulous, which is why her gel sets stay glossy for weeks.",
    specialties: ["Gel manicures", "Spa pedicures", "Minimal nail art"],
    skillCategories: ["nails-hands", "skin-facials"],
    languages: ["English", "Hindi", "Malayalam"],
    years: 5,
    employmentType: "FULL_TIME",
    startDate: "2023-01-09",
    bookable: true,
    featured: false,
    weekly: { days: [2, 3, 4, 5, 6, 7], start: "11:00", end: "20:00", sundayStart: "11:00", sundayEnd: "18:00" },
    baseSalary: 32000,
    fixedAllowance: 2500,
  },
  {
    key: "dev",
    name: "Dev Patel",
    email: email("dev", "patel"),
    phone: "+91 90000 10008",
    roleKey: "employee",
    code: "SFS-E008",
    jobTitle: "Hair Treatment Specialist (part-time)",
    bio: "Sample bio — Dev specialises in smoothing and repair treatments, and writes clear aftercare plans for every client.",
    specialties: ["Smoothing treatments", "Scalp rituals", "Colour support"],
    skillCategories: ["colour-treatments", "haircuts-styling"],
    languages: ["English", "Hindi", "Gujarati"],
    years: 6,
    employmentType: "PART_TIME",
    startDate: "2023-09-18",
    bookable: true,
    featured: false,
    weekly: { days: [4, 5, 6, 7], start: "10:00", end: "19:00", sundayStart: "11:00", sundayEnd: "18:00" },
    baseSalary: 24000,
    fixedAllowance: 1500,
  },
];

export const MANAGERS: StaffSeed[] = [
  {
    key: "priya",
    name: "Priya Sharma",
    email: email("priya", "sharma"),
    phone: "+91 90000 20001",
    roleKey: "manager",
    code: "SFS-M001",
    jobTitle: "Salon Manager",
    bio: "Sample bio — runs the floor, the schedule and the team.",
    specialties: [],
    skillCategories: [],
    languages: ["English", "Hindi"],
    years: 12,
    employmentType: "FULL_TIME",
    startDate: "2019-11-04",
    bookable: false,
    featured: false,
    weekly: { days: [2, 3, 4, 5, 6], start: "10:00", end: "19:00" },
    baseSalary: 85000,
    fixedAllowance: 6000,
  },
  {
    key: "karan",
    name: "Karan Verma",
    email: email("karan", "verma"),
    phone: "+91 90000 20002",
    roleKey: "assistant_manager",
    code: "SFS-M002",
    jobTitle: "Assistant Manager (front of house)",
    bio: "Sample bio — keeps the front desk, appointments and attendance running smoothly.",
    specialties: [],
    skillCategories: [],
    languages: ["English", "Hindi"],
    years: 5,
    employmentType: "FULL_TIME",
    startDate: "2022-07-11",
    bookable: false,
    featured: false,
    weekly: { days: [3, 4, 5, 6, 7], start: "10:00", end: "19:00", sundayStart: "11:00", sundayEnd: "18:00" },
    baseSalary: 52000,
    fixedAllowance: 4000,
  },
  {
    key: "neha",
    name: "Neha Iyer",
    email: email("neha", "iyer"),
    phone: "+91 90000 20003",
    roleKey: "senior_manager",
    code: "SFS-M003",
    jobTitle: "Senior Manager (standby)",
    bio: "Sample bio — standby senior manager; seeded as inactive to demonstrate the manager-seat limit.",
    specialties: [],
    skillCategories: [],
    languages: ["English", "Hindi", "Tamil"],
    years: 14,
    employmentType: "FULL_TIME",
    startDate: "2018-04-23",
    bookable: false,
    featured: false,
    weekly: { days: [2, 3, 4, 5, 6], start: "10:00", end: "19:00" },
    baseSalary: 95000,
    fixedAllowance: 7000,
    status: "INACTIVE",
  },
];

/** The 30 fictional customers. The first one is the demo customer account. */
export const CUSTOMER_NAMES = [
  "Riya Banerjee", "Ananya Singh", "Kavya Reddy", "Tanvi Joshi", "Mehul Shah", "Sanya Gupta", "Vihaan Rao", "Isha Kulkarni",
  "Arjun Nair", "Diya Mehta", "Rahul Chawla", "Pooja Bhatt", "Nikhil Jain", "Shreya Pillai", "Aditya Kapoor", "Naina Saxena",
  "Farhan Qureshi", "Simran Kaur", "Harsh Vardhan", "Maya Fernandes", "Rohit Sinha", "Tara Bose", "Yash Agarwal", "Lavanya Iyer",
  "Dhruv Khanna", "Esha Trivedi", "Samar Ali", "Kiara Dutta", "Veer Thakur", "Anika Menon",
];

export function customerEmail(name: string): string {
  const [first, ...rest] = name.toLowerCase().split(" ");
  return `${first}.${rest.join("")}@${DEMO_EMAIL_DOMAIN}`;
}

export function customerPhone(index: number): string {
  return `+91 90000 3${String(index).padStart(4, "0")}`;
}

export const SUPER_ADMIN = {
  name: "Samira Khan",
  email: `admin@${DEMO_EMAIL_DOMAIN}`,
  phone: "+91 90000 00001",
};
