"""
Configuration file for Medical Billing RAG Assistant
"""

# Model Configuration
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
DEFAULT_TOP_K = 10
MAX_SEARCH_RESULTS = 20

# Revenue Optimization Settings
DEFAULT_PATIENT_TYPE = "adult"
DEFAULT_TIME_OF_DAY = "regular"
DEFAULT_COMPLEXITY = "moderate"
MAX_ADD_ON_CODES = 10

# Code Categories and their descriptions
CODE_CATEGORIES = {
    "A": "Assessment - General assessments and evaluations",
    "H": "Emergency Department - ER-specific codes with time-based pricing",
    "G": "Critical Care - Life-threatening care and procedures",
    "K": "Consultation/Forms - Consultations, forms, and documentation",
    "E": "Anesthesia - Anesthesia codes and premiums",
    "B": "Telemedicine - Virtual care and telemedicine services",
    "Z": "Procedures - Surgical and medical procedures",
    "F": "Fractures - Fracture management codes",
    "D": "Dislocations - Joint dislocation treatments",
    "R": "Specialized - Specialized medical procedures",
    "M": "Major Procedures - Complex surgical procedures",
    "P": "Obstetrics - Obstetric and gynecological procedures"
}

# Time-based premium multipliers
TIME_PREMIUMS = {
    "regular": 1.0,
    "evening": 1.2,  # 20% bonus
    "weekend": 1.2,  # 20% bonus
    "holiday": 1.2,  # 20% bonus
    "night": 1.4     # 40% bonus
}

# Complexity levels and their base codes
COMPLEXITY_CODES = {
    "minor": {
        "regular": "H101",
        "evening": "H131", 
        "weekend": "H151",
        "holiday": "H151",
        "night": "H151"
    },
    "moderate": {
        "regular": "H102",
        "evening": "H132",
        "weekend": "H152", 
        "holiday": "H152",
        "night": "H152"
    },
    "high": {
        "regular": "H103",
        "evening": "H133",
        "weekend": "H153",
        "holiday": "H153", 
        "night": "H153"
    }
}

# Common procedure keywords for better matching
PROCEDURE_KEYWORDS = {
    "fracture": ["fracture", "break", "bone", "reduction"],
    "laceration": ["laceration", "cut", "wound", "repair", "suture"],
    "intubation": ["intubation", "airway", "breathing", "ventilation"],
    "chest_tube": ["chest tube", "thoracostomy", "drainage"],
    "cardioversion": ["cardioversion", "shock", "defibrillation"],
    "nerve_block": ["nerve block", "anesthesia", "injection"],
    "ultrasound": ["ultrasound", "sonography", "pocus"],
    "foreign_body": ["foreign body", "removal", "extraction"],
    "incision_drainage": ["incision", "drainage", "abscess", "i&d"]
}

# Revenue optimization tips
OPTIMIZATION_TIPS = [
    "Always bill the highest appropriate assessment level",
    "Include all applicable add-on procedures", 
    "Use time-based premiums when applicable",
    "Consider special visit premiums for after-hours calls",
    "Document thoroughly to support higher-level codes",
    "Check for trauma premiums on G-codes when ISS > 15",
    "Use pediatric emergency codes for children under 2",
    "Consider consultation codes for complex cases",
    "Add procedural tray fees when applicable",
    "Use critical care codes for life-threatening conditions"
]

# UI Configuration
APP_TITLE = "💰 Medical Billing Revenue Optimization Assistant"
APP_ICON = "💰"
PAGE_LAYOUT = "wide"

# Search Configuration
MIN_SIMILARITY_THRESHOLD = 0.3
SEARCH_TIMEOUT = 30  # seconds
