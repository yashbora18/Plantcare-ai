from sqlalchemy.orm import Session
from backend.app.models.challenge import OutdoorMission

SEED_MISSIONS = [
    {
        "title": "Soil Finger Moisture Test",
        "description": "Step outside and gently insert your index finger 2 inches into your plant pots or garden soil. Feel the moisture gradient rather than guessing from the surface.",
        "category": "soil_care",
        "estimated_minutes": 10,
        "instructions": "1. Go outside to your plants.\n2. Gently insert your finger 2 inches into the soil.\n3. Feel if it's bone-dry, pleasantly cool and moist, or soggy.\n4. Take note of whether your watering schedule matches actual soil moisture.",
        "sustainable_tip": "Overwatering kills more plants than underwatering. Testing moisture physically saves gallons of water each month.",
        "week_number": 1,
        "badge_name": "Soil Whisperer"
    },
    {
        "title": "Outdoor Growth Observation",
        "description": "Leave your smartphone behind and spend 15 minutes closely observing three living plants. Note leaf node growth, stem vigor, and light direction.",
        "category": "biodiversity",
        "estimated_minutes": 15,
        "instructions": "1. Step into natural daylight with your plants.\n2. Focus on one stem or leaf cluster at a time.\n3. Spot at least 3 distinct physical details (new furling leaves, vein pigments, stem trichomes).\n4. Record your field observation notes.",
        "sustainable_tip": "Mindful plant observation prevents pest outbreaks weeks before symptoms appear on foliage.",
        "week_number": 1,
        "badge_name": "Keen Botanist"
    },
    {
        "title": "Seed Sowing or Seedling Transplant",
        "description": "Get dirt under your fingernails! Sow a vegetable, herb, or pollinator flower seed, or transplant a root-bound plant into a larger pot.",
        "category": "planting",
        "estimated_minutes": 20,
        "instructions": "1. Prepare clean potting mix or loose garden earth.\n2. Sow seeds at twice their depth, or loosen root balls gently before transplanting.\n3. Water lightly with room temperature water.\n4. Place in appropriate morning light.",
        "sustainable_tip": "Starting native herbs from seed reduces carbon emissions associated with commercial plant freight.",
        "week_number": 1,
        "badge_name": "Green Finger"
    },
    {
        "title": "Chemical-Free Pest & Foliage Inspection",
        "description": "Carefully flip over 10 leaves to inspect the undersides for aphids, spider mites, or mealybugs. Wipe leaves down with water or organic soap spray.",
        "category": "pest_inspection",
        "estimated_minutes": 15,
        "instructions": "1. Examine leaf undersides and leaf axils where insects shelter.\n2. Look for stippling, webbing, or sticky honeydew.\n3. If pests are found, gently wipe off with a damp cotton cloth or rinse with water.\n4. Avoid indiscriminate synthetic chemical pesticides.",
        "sustainable_tip": "Preserving beneficial ladybugs, lacewings, and predatory mites creates natural ecological balance.",
        "week_number": 1,
        "badge_name": "Eco Defender"
    },
    {
        "title": "Balcony or Garden Weed & Prune",
        "description": "Spend 20 minutes maintaining a balcony container garden or yard patch. Snip dead leaves, aerate compact soil, and tidy debris.",
        "category": "community_maintenance",
        "estimated_minutes": 20,
        "instructions": "1. Use clean sterilized pruning shears.\n2. Remove fully yellowed or brown foliage that consumes plant energy.\n3. Gently cultivate top 0.5 inch of soil to prevent hydrophobic crusting.\n4. Clean pot trays to deter fungus gnats.",
        "sustainable_tip": "Pruned healthy foliage can be buried into compost instead of sent to municipal landfills.",
        "week_number": 1,
        "badge_name": "Yard Steward"
    },
    {
        "title": "Compost Check & Organic Mulching",
        "description": "Aerate your garden compost bin, or apply a layer of dry organic mulch (bark, dried leaves, straw) around your outdoor plants to retain moisture.",
        "category": "composting",
        "estimated_minutes": 15,
        "instructions": "1. Check your compost moisture (should feel like a wrung-out sponge).\n2. Aerate or turn the pile with a fork to introduce oxygen.\n3. Alternatively, apply 1-2 inches of organic mulch around potted plants to shield roots from heat.",
        "sustainable_tip": "Mulching reduces surface water evaporation by up to 50% and protects mycorrhizal fungi.",
        "week_number": 1,
        "badge_name": "Compost Master"
    },
    {
        "title": "Pollinator Watch & Sun Basking",
        "description": "Sit quietly outside for 15 minutes near flowering plants. Count how many pollinating insects or birds visit the garden blossoms.",
        "category": "biodiversity",
        "estimated_minutes": 15,
        "instructions": "1. Find a comfortable spot outside in natural ambient light.\n2. Put your device on silent or away in your pocket.\n3. Observe flying visitors: honeybees, bumblebees, hoverflies, butterflies.\n4. Appreciate the real-world ecosystem you are nurturing.",
        "sustainable_tip": "Planting open-pollinated heirloom flowers creates critical nectar corridors for threatened native bees.",
        "week_number": 1,
        "badge_name": "Pollinator Ally"
    }
]

def seed_missions_if_empty(db: Session):
    existing_count = db.query(OutdoorMission).count()
    if existing_count == 0:
        for m in SEED_MISSIONS:
            db.add(OutdoorMission(**m))
        db.commit()
