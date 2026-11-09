// City filter options for the Header dropdown. Punjab and Haryana come first (our main
// markets), then other major cities. The filter matches these names inside a product's
// location text, so use the spelling that appears in addresses (e.g. "Gurugram", "Bengaluru").

const PUNJAB = [
  "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali",
  "Pathankot", "Hoshiarpur", "Batala", "Moga", "Abohar", "Malerkotla",
  "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpura", "Firozpur",
  "Kapurthala", "Faridkot", "Sangrur", "Fazilka", "Gurdaspur", "Mansa",
  "Tarn Taran", "Nawanshahr", "Rupnagar", "Fatehgarh Sahib", "Zirakpur",
  "Kharar", "Sunam", "Nabha", "Samana", "Mukerian", "Dera Bassi",
];

const CHANDIGARH = ["Chandigarh"];

const HARYANA = [
  "Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak",
  "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa",
  "Bahadurgarh", "Jind", "Kurukshetra", "Kaithal", "Rewari", "Palwal",
  "Hansi", "Narnaul", "Fatehabad", "Jhajjar", "Charkhi Dadri", "Nuh",
  "Mahendragarh", "Tohana", "Narwana", "Pinjore",
];

const OTHER_MAJOR = [
  "Delhi", "Noida", "Ghaziabad", "Mumbai", "Thane", "Pune", "Nashik",
  "Bengaluru", "Mysuru", "Mangaluru", "Hyderabad", "Chennai", "Coimbatore",
  "Madurai", "Kolkata", "Ahmedabad", "Surat", "Vadodara", "Rajkot",
  "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Sri Ganganagar",
  "Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Meerut",
  "Saharanpur", "Bareilly", "Aligarh", "Moradabad", "Dehradun", "Haridwar",
  "Shimla", "Solan", "Baddi", "Una", "Kangra", "Jammu", "Srinagar",
  "Nagpur", "Indore", "Bhopal", "Gwalior", "Jabalpur", "Raipur", "Ranchi",
  "Patna", "Bhubaneswar", "Guwahati", "Visakhapatnam", "Vijayawada",
  "Kochi", "Thiruvananthapuram", "Peddapuram",
];

export const INDIAN_CITIES = ["All India", ...PUNJAB, ...CHANDIGARH, ...HARYANA, ...OTHER_MAJOR];
