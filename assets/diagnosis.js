// Morrill's Motors Equipment Diagnosis System

let currentEquipment = null;
let currentProblem = null;
let currentQuestionIndex = 0;
let answers = [];
let history = [];

// Problem categories for each equipment type
const problemCategories = {
    'lawn-mower': [
        { id: 'wont-start', text: "Won't start at all" },
        { id: 'hard-start', text: "Hard to start / takes many pulls" },
        { id: 'dies', text: "Starts but dies" },
        { id: 'rough-running', text: "Runs rough / sputters" },
        { id: 'no-power', text: "Lacks power / bogs down" },
        { id: 'vibration', text: "Excessive vibration" },
        { id: 'cut-quality', text: "Poor cut quality" },
        { id: 'smoke', text: "Smoking excessively" },
        { id: 'noise', text: "Unusual noises" },
        { id: 'drive', text: "Self-propel not working" }
    ],
    'chainsaw': [
        { id: 'wont-start', text: "Won't start at all" },
        { id: 'hard-start', text: "Hard to start" },
        { id: 'dies', text: "Starts but dies" },
        { id: 'no-power', text: "Lacks cutting power" },
        { id: 'chain', text: "Chain problems" },
        { id: 'oiler', text: "Bar oil not working" },
        { id: 'smoke', text: "Smoking excessively" },
        { id: 'noise', text: "Unusual noises" }
    ],
    'trimmer': [
        { id: 'wont-start', text: "Won't start at all" },
        { id: 'hard-start', text: "Hard to start" },
        { id: 'dies', text: "Starts but dies" },
        { id: 'head', text: "Trimmer head problems" },
        { id: 'no-power', text: "Lacks power" },
        { id: 'line', text: "Line feed issues" }
    ],
    'blower': [
        { id: 'wont-start', text: "Won't start at all" },
        { id: 'hard-start', text: "Hard to start" },
        { id: 'dies', text: "Starts but dies" },
        { id: 'no-power', text: "Weak air flow" },
        { id: 'noise', text: "Unusual noises" }
    ],
    'snowblower': [
        { id: 'wont-start', text: "Won't start at all" },
        { id: 'hard-start', text: "Hard to start" },
        { id: 'dies', text: "Starts but dies" },
        { id: 'no-throw', text: "Won't throw snow" },
        { id: 'auger', text: "Auger problems" },
        { id: 'drive', text: "Drive/traction issues" },
        { id: 'chute', text: "Chute won't turn" }
    ],
    'pressure-washer': [
        { id: 'wont-start', text: "Engine won't start" },
        { id: 'no-pressure', text: "No water pressure" },
        { id: 'low-pressure', text: "Low water pressure" },
        { id: 'pulsing', text: "Pulsing pressure" },
        { id: 'leaking', text: "Water leaking" },
        { id: 'dies', text: "Engine dies under load" }
    ],
    'generator': [
        { id: 'wont-start', text: "Won't start at all" },
        { id: 'no-power', text: "No electrical output" },
        { id: 'low-power', text: "Low power output" },
        { id: 'dies', text: "Shuts off under load" },
        { id: 'surging', text: "Surging / unstable power" }
    ],
    'other': [
        { id: 'wont-start', text: "Won't start at all" },
        { id: 'hard-start', text: "Hard to start" },
        { id: 'dies', text: "Starts but dies" },
        { id: 'no-power', text: "Lacks power" },
        { id: 'noise', text: "Unusual noises" },
        { id: 'other-problem', text: "Other problem" }
    ]
};

// Diagnostic question trees
const diagnosticTrees = {
    // WON'T START - Universal for most equipment
    'wont-start': [
        {
            question: "When was the last time it ran properly?",
            options: [
                { text: "Within the last month", next: 1 },
                { text: "1-6 months ago", next: 1 },
                { text: "Over 6 months ago / end of last season", next: 'stale-fuel', severity: 'medium' },
                { text: "Never / just purchased used", next: 'unknown-history', severity: 'high' }
            ]
        },
        {
            question: "Is there fresh fuel in the tank?",
            options: [
                { text: "Yes, recently added fresh fuel", next: 2 },
                { text: "Fuel has been sitting for a while", next: 'stale-fuel', severity: 'medium' },
                { text: "Not sure / same fuel from last season", next: 'stale-fuel', severity: 'medium' },
                { text: "Tank is empty", next: 'add-fuel', severity: 'diy' }
            ]
        },
        {
            question: "When you pull the starter cord (or turn the key), what happens?",
            options: [
                { text: "Nothing at all - cord won't pull / no crank", next: 'seized-engine', severity: 'high' },
                { text: "Pulls/cranks but no attempt to fire", next: 3 },
                { text: "Tries to start, pops, but won't catch", next: 4 },
                { text: "Electric start clicks but won't turn over", next: 'battery-starter', severity: 'medium' }
            ]
        },
        {
            question: "Have you checked the spark plug?",
            options: [
                { text: "Yes, it looks clean and gaps properly", next: 4 },
                { text: "Yes, it's fouled/black/wet", next: 'spark-plug', severity: 'diy-maybe' },
                { text: "Yes, it's damaged or corroded", next: 'spark-plug', severity: 'diy-maybe' },
                { text: "No / don't know how", next: 'check-spark', severity: 'diy-maybe' }
            ]
        },
        {
            question: "Is the air filter clean?",
            options: [
                { text: "Yes, clean or recently replaced", next: 5 },
                { text: "Dirty but not clogged", next: 'air-filter', severity: 'diy' },
                { text: "Very dirty / clogged", next: 'air-filter', severity: 'diy' },
                { text: "Not sure / haven't checked", next: 'air-filter', severity: 'diy' }
            ]
        },
        {
            question: "Do you smell fuel when trying to start?",
            options: [
                { text: "Yes, strong fuel smell", next: 'flooded', severity: 'diy-maybe' },
                { text: "Slight fuel smell", next: 6 },
                { text: "No fuel smell at all", next: 'fuel-delivery', severity: 'medium' }
            ]
        },
        {
            question: "Has the equipment been tipped over or stored on its side recently?",
            options: [
                { text: "Yes", next: 'tipped-over', severity: 'diy-maybe' },
                { text: "No", next: 'carburetor', severity: 'medium' }
            ]
        }
    ],

    // HARD TO START
    'hard-start': [
        {
            question: "How many pulls/attempts does it typically take to start?",
            options: [
                { text: "5-10 pulls", next: 1 },
                { text: "10-20 pulls", next: 1 },
                { text: "More than 20 pulls", next: 1 },
                { text: "Sometimes won't start at all", next: 'wont-start' }
            ]
        },
        {
            question: "Is it harder to start when cold or after it's been running?",
            options: [
                { text: "Harder when cold", next: 2 },
                { text: "Harder when hot/warm", next: 'hot-start', severity: 'medium' },
                { text: "Hard to start either way", next: 2 }
            ]
        },
        {
            question: "Are you using the choke correctly?",
            options: [
                { text: "Yes, full choke for cold start", next: 3 },
                { text: "Not sure about proper procedure", next: 'choke-procedure', severity: 'diy' },
                { text: "Choke doesn't seem to make a difference", next: 'choke-issue', severity: 'medium' }
            ]
        },
        {
            question: "When was the spark plug last replaced?",
            options: [
                { text: "Within the last year", next: 4 },
                { text: "Over a year ago", next: 'spark-plug-age', severity: 'diy-maybe' },
                { text: "Never / don't know", next: 'spark-plug-age', severity: 'diy-maybe' }
            ]
        },
        {
            question: "Is the fuel fresh (less than 30 days old)?",
            options: [
                { text: "Yes, fresh fuel", next: 'carburetor-tuning', severity: 'medium' },
                { text: "No, older fuel", next: 'stale-fuel-hard-start', severity: 'diy-maybe' },
                { text: "Using fuel stabilizer", next: 'carburetor-tuning', severity: 'medium' }
            ]
        }
    ],

    // STARTS BUT DIES
    'dies': [
        {
            question: "How quickly does it die after starting?",
            options: [
                { text: "Within a few seconds", next: 1 },
                { text: "Runs for 30 seconds to a few minutes", next: 2 },
                { text: "Dies when I release the choke", next: 'choke-dependent', severity: 'medium' },
                { text: "Dies when put under load", next: 'dies-under-load', severity: 'medium' }
            ]
        },
        {
            question: "Does it die suddenly or gradually lose power first?",
            options: [
                { text: "Dies suddenly", next: 'ignition-cutout', severity: 'medium' },
                { text: "Gradually loses power then dies", next: 'fuel-starvation', severity: 'medium' },
                { text: "Sputters then dies", next: 'fuel-starvation', severity: 'medium' }
            ]
        },
        {
            question: "Is the fuel tank vent clear? (Usually a small hole in the cap)",
            options: [
                { text: "Yes, it's clear", next: 3 },
                { text: "No, it appears blocked", next: 'fuel-cap-vent', severity: 'diy' },
                { text: "Not sure how to check", next: 'fuel-cap-check', severity: 'diy-maybe' }
            ]
        },
        {
            question: "Does it restart easily after dying?",
            options: [
                { text: "Yes, restarts right away", next: 'intermittent-issue', severity: 'medium' },
                { text: "No, have to wait before restarting", next: 'vapor-lock', severity: 'medium' },
                { text: "Gets harder to restart each time", next: 'progressive-failure', severity: 'high' }
            ]
        }
    ],

    // ROUGH RUNNING
    'rough-running': [
        {
            question: "When does it run rough?",
            options: [
                { text: "All the time", next: 1 },
                { text: "Only at idle", next: 'idle-issue', severity: 'medium' },
                { text: "Only at full throttle", next: 'high-speed-issue', severity: 'medium' },
                { text: "Only when warm", next: 'heat-related', severity: 'medium' }
            ]
        },
        {
            question: "How would you describe the rough running?",
            options: [
                { text: "Sputtering / missing", next: 2 },
                { text: "Surging (speeds up and slows down)", next: 'surging', severity: 'medium' },
                { text: "Backfiring", next: 'backfire', severity: 'medium' },
                { text: "Hunting (RPM goes up and down)", next: 'governor-issue', severity: 'medium' }
            ]
        },
        {
            question: "Is the air filter clean?",
            options: [
                { text: "Yes, clean", next: 3 },
                { text: "Dirty", next: 'air-filter-rough', severity: 'diy' },
                { text: "Not sure", next: 'air-filter-rough', severity: 'diy' }
            ]
        },
        {
            question: "When was the last tune-up (spark plug, air filter, fuel filter)?",
            options: [
                { text: "Within the last year", next: 'carburetor-dirty', severity: 'medium' },
                { text: "Over a year ago", next: 'tune-up-needed', severity: 'diy-maybe' },
                { text: "Never / don't know", next: 'tune-up-needed', severity: 'diy-maybe' }
            ]
        }
    ],

    // LACKS POWER
    'no-power': [
        {
            question: "Did the power loss happen suddenly or gradually?",
            options: [
                { text: "Suddenly", next: 1 },
                { text: "Gradually over time", next: 2 },
                { text: "Always been weak since I got it", next: 'baseline-power', severity: 'medium' }
            ]
        },
        {
            question: "Did anything happen before it lost power? (Hit something, ran out of fuel, etc.)",
            options: [
                { text: "Hit an object", next: 'impact-damage', severity: 'high' },
                { text: "Ran out of fuel", next: 'fuel-system-air', severity: 'diy-maybe' },
                { text: "Overheated", next: 'overheat-damage', severity: 'high' },
                { text: "Nothing specific", next: 'sudden-power-loss', severity: 'medium' }
            ]
        },
        {
            question: "Is the engine reaching full RPM?",
            options: [
                { text: "Yes, but still weak", next: 3 },
                { text: "No, won't rev up fully", next: 'governor-throttle', severity: 'medium' },
                { text: "Not sure how to tell", next: 3 }
            ]
        },
        {
            question: "When was the last air filter replacement?",
            options: [
                { text: "Recently", next: 'compression-valves', severity: 'high' },
                { text: "Over a year ago", next: 'air-filter-power', severity: 'diy' },
                { text: "Never / don't know", next: 'air-filter-power', severity: 'diy' }
            ]
        }
    ],

    // EXCESSIVE VIBRATION
    'vibration': [
        {
            question: "When did the vibration start?",
            options: [
                { text: "After hitting something", next: 'blade-damage', severity: 'medium' },
                { text: "Gradually got worse", next: 1 },
                { text: "Suddenly, for no apparent reason", next: 1 },
                { text: "Always vibrated", next: 'baseline-vibration', severity: 'medium' }
            ]
        },
        {
            question: "Is the blade (or cutting attachment) in good condition?",
            options: [
                { text: "Yes, looks good and balanced", next: 2 },
                { text: "Bent, damaged, or unbalanced", next: 'blade-damage', severity: 'diy-maybe' },
                { text: "Haven't checked", next: 'check-blade', severity: 'diy-maybe' }
            ]
        },
        {
            question: "Are all mounting bolts tight?",
            options: [
                { text: "Yes, all tight", next: 'internal-damage', severity: 'high' },
                { text: "Some are loose", next: 'loose-bolts', severity: 'diy' },
                { text: "Haven't checked", next: 'check-bolts', severity: 'diy' }
            ]
        }
    ],

    // POOR CUT QUALITY (Lawn Mower Specific)
    'cut-quality': [
        {
            question: "What's wrong with the cut?",
            options: [
                { text: "Uneven cut height", next: 1 },
                { text: "Grass looks torn/ragged, not clean cut", next: 'dull-blade', severity: 'diy-maybe' },
                { text: "Leaving strips of uncut grass", next: 2 },
                { text: "Clumping instead of mulching/bagging", next: 3 }
            ]
        },
        {
            question: "Are all wheels at the same height setting?",
            options: [
                { text: "Yes, all the same", next: 'deck-level', severity: 'diy-maybe' },
                { text: "Not sure", next: 'check-wheels', severity: 'diy' },
                { text: "Wheels are hard to adjust", next: 'wheel-adjustment', severity: 'diy-maybe' }
            ]
        },
        {
            question: "Is the blade sharp and not damaged?",
            options: [
                { text: "Blade is sharp", next: 'deck-belt', severity: 'medium' },
                { text: "Blade is dull", next: 'dull-blade', severity: 'diy-maybe' },
                { text: "Blade is bent or damaged", next: 'damaged-blade', severity: 'diy-maybe' }
            ]
        },
        {
            question: "Are you mowing wet grass?",
            options: [
                { text: "Yes, grass is wet", next: 'wet-grass', severity: 'diy' },
                { text: "No, grass is dry", next: 'deck-buildup', severity: 'diy-maybe' }
            ]
        }
    ],

    // SMOKING
    'smoke': [
        {
            question: "What color is the smoke?",
            options: [
                { text: "White smoke", next: 1 },
                { text: "Blue smoke", next: 'burning-oil', severity: 'high' },
                { text: "Black smoke", next: 'rich-mixture', severity: 'medium' }
            ]
        },
        {
            question: "When does the white smoke occur?",
            options: [
                { text: "Only at startup, then clears", next: 'normal-startup', severity: 'diy' },
                { text: "Continuously while running", next: 'head-gasket', severity: 'high' },
                { text: "After the mower was tipped", next: 'tipped-smoke', severity: 'diy' }
            ]
        }
    ],

    // UNUSUAL NOISES
    'noise': [
        {
            question: "What type of noise is it?",
            options: [
                { text: "Knocking / banging", next: 'knock', severity: 'high' },
                { text: "Grinding / metal on metal", next: 'grinding', severity: 'high' },
                { text: "Squealing / screeching", next: 1 },
                { text: "Clicking / ticking", next: 2 },
                { text: "Rattling", next: 3 }
            ]
        },
        {
            question: "Does the squealing happen at startup or continuously?",
            options: [
                { text: "At startup, then stops", next: 'belt-squeal', severity: 'diy-maybe' },
                { text: "Continuously", next: 'bearing-issue', severity: 'medium' }
            ]
        },
        {
            question: "Is the clicking from the engine or another component?",
            options: [
                { text: "From the engine", next: 'valve-noise', severity: 'medium' },
                { text: "From the deck/blade area", next: 'debris-noise', severity: 'diy' },
                { text: "Not sure", next: 'general-noise', severity: 'medium' }
            ]
        },
        {
            question: "Did you check for loose parts or debris?",
            options: [
                { text: "Yes, nothing loose", next: 'internal-rattle', severity: 'medium' },
                { text: "Found loose parts", next: 'loose-parts', severity: 'diy' },
                { text: "Haven't checked", next: 'check-loose', severity: 'diy' }
            ]
        }
    ],

    // SELF-PROPEL NOT WORKING
    'drive': [
        {
            question: "What happens when you engage the self-propel?",
            options: [
                { text: "Nothing at all", next: 1 },
                { text: "Moves slowly or inconsistently", next: 2 },
                { text: "Makes noise but doesn't move", next: 'drive-gear', severity: 'medium' },
                { text: "Works sometimes", next: 'drive-cable', severity: 'diy-maybe' }
            ]
        },
        {
            question: "Is the drive belt intact?",
            options: [
                { text: "Yes, looks good", next: 'drive-cable', severity: 'diy-maybe' },
                { text: "Belt is broken or worn", next: 'drive-belt', severity: 'diy-maybe' },
                { text: "Not sure how to check", next: 'drive-check', severity: 'medium' }
            ]
        },
        {
            question: "Do the wheels turn freely when not engaged?",
            options: [
                { text: "Yes, freely", next: 'transmission', severity: 'high' },
                { text: "No, stiff or stuck", next: 'wheel-bearing', severity: 'medium' }
            ]
        }
    ],

    // CHAIN PROBLEMS (Chainsaw)
    'chain': [
        {
            question: "What's the chain issue?",
            options: [
                { text: "Chain won't move", next: 'chain-brake', severity: 'diy-maybe' },
                { text: "Chain comes off the bar", next: 'chain-tension', severity: 'diy-maybe' },
                { text: "Chain is dull, not cutting well", next: 'chain-sharpen', severity: 'diy-maybe' },
                { text: "Chain is damaged", next: 'chain-replace', severity: 'diy-maybe' }
            ]
        }
    ],

    // BAR OIL (Chainsaw)
    'oiler': [
        {
            question: "Is there oil in the bar oil reservoir?",
            options: [
                { text: "Yes, it's full", next: 1 },
                { text: "No, it's empty", next: 'add-bar-oil', severity: 'diy' },
                { text: "Yes, but oil is old/thick", next: 'old-bar-oil', severity: 'diy' }
            ]
        },
        {
            question: "Is the oil port (on the bar) clear of debris?",
            options: [
                { text: "Yes, clear", next: 'oil-pump', severity: 'medium' },
                { text: "No, clogged", next: 'clean-oil-port', severity: 'diy' },
                { text: "Not sure how to check", next: 'check-oil-port', severity: 'diy-maybe' }
            ]
        }
    ],

    // TRIMMER HEAD PROBLEMS
    'head': [
        {
            question: "What's wrong with the trimmer head?",
            options: [
                { text: "Head won't spin", next: 'clutch-issue', severity: 'medium' },
                { text: "Head spins but won't cut", next: 'line-issue', severity: 'diy' },
                { text: "Head is wobbling", next: 'head-damaged', severity: 'diy-maybe' },
                { text: "Can't reload line", next: 'reload-line', severity: 'diy' }
            ]
        }
    ],

    // LINE FEED ISSUES
    'line': [
        {
            question: "What's the line feed problem?",
            options: [
                { text: "Bump feed not working", next: 'bump-feed', severity: 'diy-maybe' },
                { text: "Line keeps breaking", next: 'line-breaking', severity: 'diy' },
                { text: "Line won't come out", next: 'line-stuck', severity: 'diy-maybe' },
                { text: "Auto-feed not working", next: 'auto-feed', severity: 'diy-maybe' }
            ]
        }
    ],

    // SNOWBLOWER AUGER
    'auger': [
        {
            question: "What's the auger issue?",
            options: [
                { text: "Auger won't spin at all", next: 'shear-pin', severity: 'diy-maybe' },
                { text: "Auger spins but impeller doesn't", next: 'impeller-issue', severity: 'medium' },
                { text: "Making grinding noise", next: 'auger-bearing', severity: 'medium' },
                { text: "Auger damaged/bent", next: 'auger-damage', severity: 'high' }
            ]
        }
    ],

    // SNOWBLOWER WON'T THROW
    'no-throw': [
        {
            question: "Is the auger spinning?",
            options: [
                { text: "Yes", next: 1 },
                { text: "No", next: 'auger' }
            ]
        },
        {
            question: "Is snow going through but not throwing far?",
            options: [
                { text: "Yes, weak throw", next: 'impeller-clearance', severity: 'medium' },
                { text: "Snow is clogging", next: 'chute-clog', severity: 'diy' },
                { text: "Nothing coming out", next: 'impeller-issue', severity: 'medium' }
            ]
        }
    ],

    // CHUTE ISSUES
    'chute': [
        {
            question: "What's wrong with the chute?",
            options: [
                { text: "Chute won't rotate", next: 'chute-gear', severity: 'diy-maybe' },
                { text: "Deflector won't adjust", next: 'deflector-issue', severity: 'diy' },
                { text: "Chute is damaged", next: 'chute-damage', severity: 'medium' }
            ]
        }
    ],

    // PRESSURE WASHER - NO PRESSURE
    'no-pressure': [
        {
            question: "Is water flowing through the machine?",
            options: [
                { text: "Yes, but no pressure", next: 1 },
                { text: "No water at all", next: 'water-supply', severity: 'diy' },
                { text: "Very little water", next: 'inlet-filter', severity: 'diy' }
            ]
        },
        {
            question: "Have you checked the nozzle?",
            options: [
                { text: "Yes, nozzle is clear", next: 'pump-issue', severity: 'high' },
                { text: "Nozzle is clogged", next: 'nozzle-clog', severity: 'diy' },
                { text: "Haven't checked", next: 'check-nozzle', severity: 'diy' }
            ]
        }
    ],

    // PRESSURE WASHER - LOW PRESSURE
    'low-pressure': [
        {
            question: "Is the inlet water supply adequate?",
            options: [
                { text: "Yes, good water flow", next: 1 },
                { text: "Water supply is weak", next: 'water-supply', severity: 'diy' },
                { text: "Not sure", next: 'check-supply', severity: 'diy' }
            ]
        },
        {
            question: "Are you using the correct nozzle?",
            options: [
                { text: "Yes", next: 'unloader-valve', severity: 'medium' },
                { text: "Not sure which to use", next: 'nozzle-selection', severity: 'diy' },
                { text: "Nozzle is worn", next: 'nozzle-worn', severity: 'diy' }
            ]
        }
    ],

    // PRESSURE WASHER - PULSING
    'pulsing': [
        {
            question: "When does the pulsing occur?",
            options: [
                { text: "All the time", next: 'air-in-line', severity: 'diy-maybe' },
                { text: "Only at certain pressures", next: 'unloader-issue', severity: 'medium' },
                { text: "After sitting unused", next: 'stuck-valve', severity: 'medium' }
            ]
        }
    ],

    // PRESSURE WASHER - LEAKING
    'leaking': [
        {
            question: "Where is the leak?",
            options: [
                { text: "At the hose connections", next: 'connection-leak', severity: 'diy' },
                { text: "From the pump", next: 'pump-seals', severity: 'high' },
                { text: "From the wand/gun", next: 'gun-leak', severity: 'diy-maybe' }
            ]
        }
    ],

    // GENERATOR - NO OUTPUT
    'no-power': [
        {
            question: "Is the engine running properly?",
            options: [
                { text: "Yes, running fine", next: 1 },
                { text: "Running rough", next: 'rough-running' },
                { text: "Not running", next: 'wont-start' }
            ]
        },
        {
            question: "Have you checked the circuit breaker?",
            options: [
                { text: "Yes, it's not tripped", next: 'avr-issue', severity: 'high' },
                { text: "It was tripped, I reset it", next: 'overload', severity: 'diy-maybe' },
                { text: "Haven't checked", next: 'check-breaker', severity: 'diy' }
            ]
        }
    ],

    // GENERATOR - LOW OUTPUT
    'low-power': [
        {
            question: "What's happening with the power?",
            options: [
                { text: "Voltage is low", next: 'avr-adjustment', severity: 'medium' },
                { text: "Can't run all my devices", next: 'overload-calc', severity: 'diy' },
                { text: "Power fluctuates", next: 'surging' }
            ]
        }
    ],

    // GENERATOR - SURGING
    'surging': [
        {
            question: "When does the surging occur?",
            options: [
                { text: "All the time", next: 'carburetor-gen', severity: 'medium' },
                { text: "Only under load", next: 'governor-gen', severity: 'medium' },
                { text: "Only at idle", next: 'idle-adjustment', severity: 'medium' }
            ]
        }
    ],

    // OTHER PROBLEM
    'other-problem': [
        {
            question: "Can you describe the general category of the problem?",
            options: [
                { text: "Engine related", next: 'engine-other', severity: 'medium' },
                { text: "Mechanical/moving parts", next: 'mechanical-other', severity: 'medium' },
                { text: "Electrical", next: 'electrical-other', severity: 'high' },
                { text: "Body/frame damage", next: 'body-other', severity: 'medium' },
                { text: "Not sure", next: 'unknown-other', severity: 'high' }
            ]
        }
    ]
};

// Diagnosis results
const diagnosisResults = {
    // DIY Results (Can likely fix yourself)
    'add-fuel': {
        title: "Empty Fuel Tank",
        severity: 'diy',
        description: "Your fuel tank appears to be empty.",
        diySteps: [
            "Add fresh gasoline (use fuel stabilizer if it will sit)",
            "For 2-stroke engines: mix fuel and oil at the correct ratio",
            "Prime the carburetor if equipped with a primer bulb",
            "Try starting again"
        ],
        bringIn: false,
        note: "Use fresh fuel less than 30 days old for best results. Ethanol-free fuel is recommended."
    },
    'stale-fuel': {
        title: "Stale Fuel Issue",
        severity: 'medium',
        description: "Fuel that's been sitting for months can gum up the carburetor and prevent starting.",
        diySteps: [
            "Drain the old fuel from the tank",
            "Add fresh gasoline with fuel stabilizer",
            "Try starting - it may take several attempts"
        ],
        bringIn: true,
        bringInReason: "If it still won't start after fresh fuel, the carburetor likely needs cleaning. This requires specialized tools and expertise."
    },
    'spark-plug': {
        title: "Spark Plug Issue",
        severity: 'diy-maybe',
        description: "The spark plug may be fouled, worn, or damaged.",
        diySteps: [
            "Remove and inspect the spark plug",
            "Clean with a wire brush or replace if damaged",
            "Check the gap matches specifications",
            "Reinstall and try starting"
        ],
        bringIn: true,
        bringInReason: "If the spark plug keeps fouling or the engine still won't run properly, there may be underlying issues that need professional diagnosis."
    },
    'check-spark': {
        title: "Check Spark First",
        severity: 'diy-maybe',
        description: "The spark plug is one of the most common causes of starting issues and should be checked first.",
        diySteps: [
            "Locate and remove the spark plug (usually on top of the engine)",
            "Inspect for damage, carbon buildup, or wetness",
            "Clean or replace as needed",
            "Check the spark plug gap with a feeler gauge"
        ],
        bringIn: true,
        bringInReason: "If you're not comfortable checking the spark plug, or if the engine still won't start after replacing it, bring it in for diagnosis."
    },
    'air-filter': {
        title: "Check/Replace Air Filter",
        severity: 'diy',
        description: "A clogged air filter restricts airflow and can prevent starting or cause poor performance.",
        diySteps: [
            "Locate and remove the air filter cover",
            "Remove the air filter and inspect it",
            "Clean foam filters with soap and water, let dry completely",
            "Replace paper filters if dirty",
            "Reinstall and try starting"
        ],
        bringIn: false,
        note: "Air filters should be checked every 25 hours of use or at least once per season."
    },
    'flooded': {
        title: "Engine Flooded",
        severity: 'diy-maybe',
        description: "Too much fuel has entered the combustion chamber.",
        diySteps: [
            "Wait 15-20 minutes for fuel to evaporate",
            "Move the choke to OFF/RUN position",
            "Hold the throttle wide open while pulling the starter",
            "If it has a spark plug, remove it and let the cylinder dry"
        ],
        bringIn: true,
        bringInReason: "If flooding keeps happening, the carburetor may need adjustment or rebuilding."
    },
    'tipped-over': {
        title: "Oil in Combustion Chamber",
        severity: 'diy-maybe',
        description: "Tipping the equipment can cause oil to enter the cylinder or air filter.",
        diySteps: [
            "Check the air filter - if oily, clean or replace it",
            "Remove spark plug and pull starter several times to clear oil",
            "Let it sit upright for 30 minutes",
            "Reinstall spark plug and try starting"
        ],
        bringIn: true,
        bringInReason: "If it smokes excessively for more than a few minutes or won't run properly, bring it in for inspection."
    },
    'fuel-cap-vent': {
        title: "Blocked Fuel Cap Vent",
        severity: 'diy',
        description: "A blocked vent creates a vacuum in the tank, stopping fuel flow.",
        diySteps: [
            "Loosen the fuel cap and try starting",
            "If it runs better, clean or replace the cap",
            "Check that the vent hole is clear"
        ],
        bringIn: false
    },
    'dull-blade': {
        title: "Dull Mower Blade",
        severity: 'diy-maybe',
        description: "A dull blade tears grass instead of cutting it cleanly.",
        diySteps: [
            "Remove the blade (disconnect spark plug first!)",
            "Sharpen with a file or grinder, maintaining the original angle",
            "Check blade balance after sharpening",
            "Reinstall blade - torque to specification"
        ],
        bringIn: true,
        bringInReason: "Blade sharpening and balancing requires proper technique. An unbalanced blade can damage the engine. We offer professional sharpening services."
    },
    'wet-grass': {
        title: "Mowing Wet Grass",
        severity: 'diy',
        description: "Wet grass clumps and doesn't cut or mulch well.",
        diySteps: [
            "Wait for the grass to dry before mowing",
            "If you must mow wet, raise the cutting height",
            "Clean the deck after mowing wet grass",
            "Consider side discharge instead of mulching"
        ],
        bringIn: false
    },
    'chain-tension': {
        title: "Chain Tension Adjustment",
        severity: 'diy-maybe',
        description: "The chain needs proper tension to stay on the bar.",
        diySteps: [
            "Loosen the bar nuts",
            "Adjust the tensioning screw until chain is snug",
            "Chain should lift slightly but not come off the bar",
            "Retighten the bar nuts"
        ],
        bringIn: true,
        bringInReason: "If the chain keeps coming off, the bar groove may be worn or there may be other issues."
    },
    'chain-sharpen': {
        title: "Chain Sharpening Needed",
        severity: 'diy-maybe',
        description: "A dull chain makes cutting difficult and dangerous.",
        diySteps: [
            "Use a round file matched to your chain size",
            "File at the correct angle (usually 30-35 degrees)",
            "File same number of strokes on each tooth",
            "Check depth gauges and file if needed"
        ],
        bringIn: true,
        bringInReason: "Professional chain sharpening ensures consistent cutting. We can sharpen or replace your chain quickly."
    },
    'add-bar-oil': {
        title: "Add Bar & Chain Oil",
        severity: 'diy',
        description: "The chain and bar need constant lubrication.",
        diySteps: [
            "Fill the bar oil reservoir with bar & chain oil",
            "Never use motor oil - it's too thin",
            "Check oil level before each use"
        ],
        bringIn: false
    },
    'line-issue': {
        title: "Trimmer Line Issue",
        severity: 'diy',
        description: "The trimmer line needs to be replaced or is wound incorrectly.",
        diySteps: [
            "Remove the trimmer head cover",
            "Replace with correct diameter line",
            "Wind in the direction of the arrows",
            "Leave about 6 inches extending"
        ],
        bringIn: false,
        note: "Keep spare trimmer line on hand. Using the wrong diameter can cause problems."
    },
    'shear-pin': {
        title: "Possible Shear Pin Break",
        severity: 'diy-maybe',
        description: "Shear pins are designed to break to protect the gearbox when hitting hard objects.",
        diySteps: [
            "Check the auger shear pins (metal pins through auger shaft)",
            "If broken, replace with CORRECT OEM shear pins only",
            "Never use regular bolts - they won't break and can damage the gearbox",
            "Check for debris that may have caused the break"
        ],
        bringIn: true,
        bringInReason: "If shear pins keep breaking or you're not sure how to replace them, bring it in."
    },
    'chute-clog': {
        title: "Chute Clogged",
        severity: 'diy',
        description: "Snow has packed into the chute or impeller area.",
        diySteps: [
            "ALWAYS turn off the engine first!",
            "NEVER use your hands - use a wooden stick or plastic tool",
            "Clear packed snow from the chute and housing",
            "Spray silicone lubricant to prevent future sticking"
        ],
        bringIn: false,
        note: "Never put your hands in the chute or auger area, even with the engine off. The impeller can still rotate."
    },
    'water-supply': {
        title: "Check Water Supply",
        severity: 'diy',
        description: "The pressure washer needs adequate water flow to work properly.",
        diySteps: [
            "Make sure the garden hose is fully turned on",
            "Check for kinks in the supply hose",
            "Remove and clean the inlet filter screen",
            "Verify water is flowing before starting the engine"
        ],
        bringIn: false
    },
    'nozzle-clog': {
        title: "Clogged Nozzle",
        severity: 'diy',
        description: "Debris in the nozzle is blocking water flow.",
        diySteps: [
            "Remove the nozzle from the wand",
            "Clean with a small wire or nozzle cleaning tool",
            "Rinse thoroughly",
            "Reinstall and test"
        ],
        bringIn: false
    },
    'connection-leak': {
        title: "Leaky Connections",
        severity: 'diy',
        description: "Water is leaking from hose or wand connections.",
        diySteps: [
            "Check that all connections are tight",
            "Inspect O-rings for damage and replace if needed",
            "Apply thread tape to threaded connections",
            "Replace worn or damaged fittings"
        ],
        bringIn: false
    },
    'check-breaker': {
        title: "Check Circuit Breaker",
        severity: 'diy',
        description: "The circuit breaker may have tripped due to overload.",
        diySteps: [
            "Locate the circuit breaker on the generator panel",
            "If tripped, reset it by pushing firmly",
            "Reduce the electrical load if it keeps tripping",
            "Calculate total wattage of connected devices"
        ],
        bringIn: false
    },
    'overload': {
        title: "Generator Overload",
        severity: 'diy-maybe',
        description: "The generator is being asked to power more than its capacity.",
        diySteps: [
            "Add up the wattage of all connected devices",
            "Starting wattage for motors is 2-3x running wattage",
            "Stay below 80% of generator's rated capacity",
            "Start largest loads first, then add smaller ones"
        ],
        bringIn: true,
        bringInReason: "If overloads continue with reasonable loads, there may be an internal issue."
    },
    'overload-calc': {
        title: "Calculate Power Needs",
        severity: 'diy',
        description: "You may be exceeding the generator's capacity.",
        diySteps: [
            "List all devices you want to power",
            "Find the wattage on each device's label",
            "Add 2-3x wattage for motor starting loads",
            "Total should be under 80% of generator rating",
            "Prioritize essential devices"
        ],
        bringIn: false
    },
    'loose-bolts': {
        title: "Tighten Loose Hardware",
        severity: 'diy',
        description: "Loose bolts can cause vibration and potential damage.",
        diySteps: [
            "Check all visible bolts and fasteners",
            "Tighten any loose hardware",
            "Check blade bolt torque (if applicable)",
            "Inspect for damaged or missing fasteners"
        ],
        bringIn: false
    },
    'check-bolts': {
        title: "Inspect All Fasteners",
        severity: 'diy',
        description: "Vibration is often caused by loose or damaged fasteners.",
        diySteps: [
            "With engine OFF, check all bolts and screws",
            "Pay special attention to blade/deck bolts",
            "Check engine mounting bolts",
            "Tighten anything loose to proper torque"
        ],
        bringIn: false
    },
    'debris-noise': {
        title: "Clear Debris",
        severity: 'diy',
        description: "Debris caught in the deck or around moving parts can cause noise.",
        diySteps: [
            "Turn off the engine and disconnect spark plug",
            "Check under the deck for sticks, rocks, or debris",
            "Check around the engine and belt areas",
            "Remove any foreign objects"
        ],
        bringIn: false
    },
    'loose-parts': {
        title: "Secure Loose Parts",
        severity: 'diy',
        description: "Loose parts are causing the rattling noise.",
        diySteps: [
            "Identify all loose components",
            "Tighten or replace fasteners as needed",
            "Check for cracked or broken mounts",
            "Replace any damaged parts"
        ],
        bringIn: false
    },
    'check-loose': {
        title: "Inspect for Loose Parts",
        severity: 'diy',
        description: "Rattling is commonly caused by loose components.",
        diySteps: [
            "With engine off, shake/wiggle all external components",
            "Check handles, covers, shields, and guards",
            "Inspect the muffler and heat shields",
            "Look for anything that might have come loose"
        ],
        bringIn: false
    },
    'choke-procedure': {
        title: "Proper Starting Procedure",
        severity: 'diy',
        description: "Using the correct starting procedure makes a big difference.",
        diySteps: [
            "COLD START: Choke ON (closed), throttle to FAST or START position",
            "Prime 3-5 times if equipped with primer bulb",
            "Pull starter until it fires",
            "Move choke to half/off as engine warms",
            "WARM START: Choke OFF, throttle to FAST, pull to start"
        ],
        bringIn: false
    },
    'reload-line': {
        title: "Reloading Trimmer Line",
        severity: 'diy',
        description: "Here's how to properly reload your trimmer line.",
        diySteps: [
            "Remove the spool from the trimmer head",
            "Cut the correct length of new line",
            "Wind the line in the direction shown by arrows",
            "Leave 6 inches extending through the eyelets",
            "Reinstall the spool and cover"
        ],
        bringIn: false
    },
    'deflector-issue': {
        title: "Deflector Adjustment",
        severity: 'diy',
        description: "The chute deflector controls how high snow is thrown.",
        diySteps: [
            "Check the deflector cable or rod for damage",
            "Lubricate pivot points with white lithium grease",
            "Adjust cable tension if needed",
            "Check for ice buildup restricting movement"
        ],
        bringIn: false
    },
    'nozzle-selection': {
        title: "Nozzle Selection Guide",
        severity: 'diy',
        description: "Using the right nozzle is important for proper pressure.",
        diySteps: [
            "Red (0°): Very concentrated - use with caution",
            "Yellow (15°): Heavy cleaning, stripping",
            "Green (25°): General cleaning, most common",
            "White (40°): Light cleaning, delicate surfaces",
            "Black (soaping): Low pressure for detergent"
        ],
        bringIn: false
    },
    'nozzle-worn': {
        title: "Replace Worn Nozzle",
        severity: 'diy',
        description: "Nozzles wear out over time and lose pressure.",
        diySteps: [
            "Compare spray pattern to a new nozzle",
            "If spray is wider or weaker, nozzle is worn",
            "Replace with same size/angle nozzle",
            "Nozzles should be replaced annually with heavy use"
        ],
        bringIn: false
    },
    'normal-startup': {
        title: "Normal Startup Smoke",
        severity: 'diy',
        description: "A small amount of white smoke at startup is normal, especially in cold weather.",
        diySteps: [
            "This is usually just condensation burning off",
            "Should clear up within 30 seconds to a minute",
            "Check oil level to make sure it's not overfilled",
            "If smoke persists, bring it in for evaluation"
        ],
        bringIn: false
    },
    'tipped-smoke': {
        title: "Smoke After Tipping",
        severity: 'diy',
        description: "Oil entered the combustion chamber when the equipment was tipped.",
        diySteps: [
            "Let it run - the smoke should clear in a few minutes",
            "Check/replace air filter if it got oily",
            "In the future, tip with spark plug side UP",
            "If smoke continues beyond 5 minutes, stop and bring it in"
        ],
        bringIn: false
    },
    'belt-squeal': {
        title: "Belt Squeal",
        severity: 'diy-maybe',
        description: "A squealing belt may be loose, worn, or contaminated.",
        diySteps: [
            "Inspect the belt for cracks, fraying, or glazing",
            "Check belt tension - there should be slight deflection",
            "Clean any oil or debris from belt and pulleys",
            "Replace belt if worn"
        ],
        bringIn: true,
        bringInReason: "If the belt keeps squealing after adjustment, or you're not comfortable replacing it, bring it in."
    },

    // BRING TO SHOP Results
    'seized-engine': {
        title: "Possible Seized Engine",
        severity: 'high',
        description: "If the engine won't turn over at all, it may be seized due to lack of lubrication or internal damage.",
        diySteps: [
            "Check oil level - if empty, do not run",
            "Try turning the blade/flywheel by hand (with spark plug removed)"
        ],
        bringIn: true,
        bringInReason: "A seized engine requires professional diagnosis. It may be repairable, or the damage may be too extensive. We can assess the engine and give you repair options."
    },
    'battery-starter': {
        title: "Battery or Starter Issue",
        severity: 'medium',
        description: "The electric start system has a problem - could be battery, starter, solenoid, or wiring.",
        diySteps: [
            "Check battery connections for corrosion",
            "Try charging the battery",
            "Check if the manual pull start works"
        ],
        bringIn: true,
        bringInReason: "Electrical diagnosis requires proper testing equipment. We can test the battery, starter, and charging system."
    },
    'unknown-history': {
        title: "Unknown Equipment History",
        severity: 'high',
        description: "Equipment with unknown history may have underlying issues that aren't immediately apparent.",
        diySteps: [
            "Check oil level and condition",
            "Drain old fuel and add fresh",
            "Check air filter condition"
        ],
        bringIn: true,
        bringInReason: "We recommend a full inspection of used equipment with unknown history to identify any issues before they cause more damage."
    },
    'fuel-delivery': {
        title: "Fuel Delivery Problem",
        severity: 'medium',
        description: "Fuel isn't reaching the combustion chamber properly.",
        diySteps: [
            "Check that fuel shutoff valve is open (if equipped)",
            "Inspect fuel line for cracks or blockage",
            "Check fuel filter if accessible"
        ],
        bringIn: true,
        bringInReason: "Fuel system issues often involve the carburetor, which requires specialized cleaning and adjustment."
    },
    'carburetor': {
        title: "Carburetor Service Needed",
        severity: 'medium',
        description: "The carburetor is likely dirty or needs adjustment.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Carburetor cleaning and rebuilding requires specialized knowledge, tools, and parts. Old fuel deposits and varnish cause most carburetor issues. We can clean, rebuild, or replace the carburetor as needed."
    },
    'hot-start': {
        title: "Hot Starting Issue",
        severity: 'medium',
        description: "Difficulty starting when warm often indicates valve, ignition, or carburetor issues.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Hot starting problems can have multiple causes including valve adjustment, ignition coil, or carburetor issues. Professional diagnosis is recommended."
    },
    'choke-issue': {
        title: "Choke System Problem",
        severity: 'medium',
        description: "The choke may not be functioning correctly.",
        diySteps: [],
        bringIn: true,
        bringInReason: "The choke linkage, cable, or carburetor choke plate may need adjustment or repair."
    },
    'spark-plug-age': {
        title: "Spark Plug Replacement Due",
        severity: 'diy-maybe',
        description: "Spark plugs should be replaced at least annually or every 100 hours.",
        diySteps: [
            "Purchase the correct spark plug for your engine",
            "Remove old plug and inspect",
            "Gap new plug to specification",
            "Install new plug - don't overtighten"
        ],
        bringIn: true,
        bringInReason: "If replacing the spark plug doesn't help, or you're not sure which plug to use, we can help."
    },
    'stale-fuel-hard-start': {
        title: "Old Fuel Contributing to Hard Starting",
        severity: 'diy-maybe',
        description: "Fuel older than 30 days begins to degrade and can cause starting issues.",
        diySteps: [
            "Drain old fuel from tank and carburetor",
            "Add fresh fuel with stabilizer",
            "Try starting"
        ],
        bringIn: true,
        bringInReason: "If it still won't start easily with fresh fuel, the carburetor may have varnish deposits that need cleaning."
    },
    'carburetor-tuning': {
        title: "Carburetor Adjustment Needed",
        severity: 'medium',
        description: "The carburetor may need professional adjustment.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Modern carburetors often have limited adjustment screws or require special tools. EPA regulations also limit adjustability on newer equipment. Professional tuning can optimize performance."
    },
    'choke-dependent': {
        title: "Engine Runs Only on Choke",
        severity: 'medium',
        description: "If the engine only runs with the choke on, it's running too lean - not getting enough fuel.",
        diySteps: [],
        bringIn: true,
        bringInReason: "This typically indicates a carburetor issue - clogged jets, bad gaskets, or adjustment problems. Professional cleaning/rebuild is needed."
    },
    'dies-under-load': {
        title: "Dies Under Load",
        severity: 'medium',
        description: "Engine dying under load suggests fuel, air, or governor issues.",
        diySteps: [
            "Check air filter - replace if dirty",
            "Make sure using fresh fuel"
        ],
        bringIn: true,
        bringInReason: "Load-related stalling often involves the governor, carburetor, or ignition system. Professional diagnosis is recommended."
    },
    'ignition-cutout': {
        title: "Possible Ignition Problem",
        severity: 'medium',
        description: "Sudden shutoffs often indicate ignition system issues.",
        diySteps: [],
        bringIn: true,
        bringInReason: "The ignition coil, kill switch, or wiring may be failing. This requires proper testing equipment to diagnose."
    },
    'fuel-starvation': {
        title: "Fuel Starvation",
        severity: 'medium',
        description: "The engine isn't getting consistent fuel supply.",
        diySteps: [
            "Check fuel cap vent",
            "Inspect fuel lines for cracks or kinks",
            "Replace fuel filter if accessible"
        ],
        bringIn: true,
        bringInReason: "If basic checks don't solve it, the carburetor or fuel pump (if equipped) may need service."
    },
    'fuel-cap-check': {
        title: "Check Fuel Cap Vent",
        severity: 'diy-maybe',
        description: "A blocked fuel cap vent is a common cause of engines dying after running briefly.",
        diySteps: [
            "Try loosening the fuel cap and running the engine",
            "If it runs better, the vent is blocked",
            "Clean or replace the fuel cap"
        ],
        bringIn: true,
        bringInReason: "If the cap vent isn't the issue, bring it in for further diagnosis."
    },
    'intermittent-issue': {
        title: "Intermittent Running Problem",
        severity: 'medium',
        description: "Intermittent issues can be the hardest to diagnose - could be ignition, fuel, or electrical.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Intermittent problems require systematic testing to identify. Our technicians can perform thorough diagnostics."
    },
    'vapor-lock': {
        title: "Possible Vapor Lock / Heat Issue",
        severity: 'medium',
        description: "The engine may be overheating or experiencing fuel vaporization.",
        diySteps: [
            "Check that cooling fins are clean",
            "Make sure the shroud/covers are in place",
            "Check for debris blocking air flow"
        ],
        bringIn: true,
        bringInReason: "Heat-related issues can indicate serious problems. The engine may need inspection for proper cooling and fuel system integrity."
    },
    'progressive-failure': {
        title: "Progressive Failure",
        severity: 'high',
        description: "Getting harder to start each time suggests a worsening problem.",
        diySteps: [],
        bringIn: true,
        bringInReason: "This pattern often indicates ignition coil failure, compression loss, or other serious issues. Stop using it and bring it in before the problem gets worse."
    },
    'idle-issue': {
        title: "Idle Problem",
        severity: 'medium',
        description: "The engine has trouble idling smoothly.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Idle issues usually require carburetor adjustment or cleaning. The idle circuit may be clogged or need adjustment."
    },
    'high-speed-issue': {
        title: "High Speed Running Problem",
        severity: 'medium',
        description: "The engine runs rough at full throttle.",
        diySteps: [
            "Make sure air filter is clean",
            "Verify using fresh fuel"
        ],
        bringIn: true,
        bringInReason: "High-speed running issues often involve carburetor jetting, governor, or ignition timing. Professional adjustment is needed."
    },
    'heat-related': {
        title: "Heat-Related Running Issue",
        severity: 'medium',
        description: "Problems that only occur when warm suggest heat-sensitive components.",
        diySteps: [
            "Check cooling fins are clean",
            "Make sure shrouds are in place"
        ],
        bringIn: true,
        bringInReason: "The ignition coil or other components may be failing when hot. This requires testing while the engine is warm."
    },
    'surging': {
        title: "Engine Surging",
        severity: 'medium',
        description: "Engine surging (hunting) is usually a governor or carburetor issue.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Governor adjustment and carburetor tuning require experience and often special tools. Improper adjustment can cause engine damage."
    },
    'backfire': {
        title: "Engine Backfiring",
        severity: 'medium',
        description: "Backfiring can indicate timing, valve, or carburetor issues.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Backfiring can cause damage and indicates a problem that needs professional diagnosis - could be valve adjustment, timing, or fuel mixture."
    },
    'governor-issue': {
        title: "Governor Problem",
        severity: 'medium',
        description: "The governor controls engine speed under varying loads.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Governor adjustment requires proper technique. Incorrect adjustment can cause engine damage from over-revving or poor performance."
    },
    'air-filter-rough': {
        title: "Check Air Filter",
        severity: 'diy',
        description: "A dirty air filter can cause rough running.",
        diySteps: [
            "Remove and inspect the air filter",
            "Clean foam filters with soap and water, let dry",
            "Replace paper filters if dirty",
            "Never run without an air filter"
        ],
        bringIn: true,
        bringInReason: "If cleaning/replacing the air filter doesn't help, bring it in for diagnosis."
    },
    'tune-up-needed': {
        title: "Tune-Up Recommended",
        severity: 'diy-maybe',
        description: "Regular maintenance keeps engines running smoothly.",
        diySteps: [
            "Replace spark plug",
            "Replace air filter",
            "Replace fuel filter (if equipped)",
            "Add fresh fuel with stabilizer"
        ],
        bringIn: true,
        bringInReason: "We offer complete tune-up services including carburetor cleaning, which is often needed after extended use or storage. A professional tune-up ensures optimal performance."
    },
    'carburetor-dirty': {
        title: "Carburetor Cleaning Needed",
        severity: 'medium',
        description: "The carburetor likely has deposits affecting fuel delivery.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Carburetor cleaning requires disassembly and specialized cleaning. We can properly clean and adjust your carburetor."
    },
    'impact-damage': {
        title: "Possible Impact Damage",
        severity: 'high',
        description: "Hitting an object can cause blade, crankshaft, or deck damage.",
        diySteps: [
            "DO NOT continue to run the equipment",
            "Check blade for damage (disconnect spark plug first)",
            "Check for unusual vibration"
        ],
        bringIn: true,
        bringInReason: "Impact damage can bend the crankshaft, which causes severe vibration and internal engine damage. This needs professional inspection before running again."
    },
    'fuel-system-air': {
        title: "Air in Fuel System",
        severity: 'diy-maybe',
        description: "Running out of fuel introduces air into the fuel system.",
        diySteps: [
            "Add fresh fuel",
            "Prime the system if equipped with primer bulb",
            "Crank several times to purge air",
            "Try starting"
        ],
        bringIn: true,
        bringInReason: "If it still won't run properly after priming, the carburetor may need service."
    },
    'overheat-damage': {
        title: "Possible Overheat Damage",
        severity: 'high',
        description: "Overheating can cause serious internal engine damage.",
        diySteps: [
            "Do not run the engine",
            "Check oil level",
            "Inspect cooling fins and shrouds"
        ],
        bringIn: true,
        bringInReason: "Overheating can warp cylinder heads, damage piston rings, and cause other serious problems. The engine needs inspection before running again."
    },
    'sudden-power-loss': {
        title: "Sudden Power Loss",
        severity: 'medium',
        description: "Sudden power loss without apparent cause needs diagnosis.",
        diySteps: [
            "Check air filter",
            "Verify fuel is fresh",
            "Check for exhaust blockage"
        ],
        bringIn: true,
        bringInReason: "Sudden power loss can indicate compression problems, ignition issues, or carburetor problems. Professional diagnosis recommended."
    },
    'governor-throttle': {
        title: "Governor/Throttle Problem",
        severity: 'medium',
        description: "The engine's speed control system isn't functioning correctly.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Governor and throttle systems require proper adjustment. Incorrect settings can damage the engine or cause unsafe operation."
    },
    'air-filter-power': {
        title: "Replace Air Filter",
        severity: 'diy',
        description: "A restricted air filter reduces engine power significantly.",
        diySteps: [
            "Remove and inspect the air filter",
            "If dirty, clean or replace it",
            "Check that the filter housing is sealing properly"
        ],
        bringIn: true,
        bringInReason: "If power doesn't improve with a clean filter, there may be carburetor, compression, or other issues."
    },
    'compression-valves': {
        title: "Possible Compression/Valve Issue",
        severity: 'high',
        description: "Power loss with proper maintenance may indicate internal engine issues.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Low compression or valve problems require professional diagnosis and repair. This may involve a compression test, valve adjustment, or head gasket replacement."
    },
    'blade-damage': {
        title: "Blade/Attachment Damage",
        severity: 'medium',
        description: "The blade or cutting attachment may be bent or damaged.",
        diySteps: [
            "Disconnect spark plug before inspection",
            "Inspect blade for bends, cracks, or damage",
            "Check that blade adapter/mandrel is tight"
        ],
        bringIn: true,
        bringInReason: "A bent blade can indicate crankshaft damage. We can check the crankshaft and replace the blade if needed."
    },
    'check-blade': {
        title: "Inspect Blade/Cutting Attachment",
        severity: 'diy-maybe',
        description: "Vibration is often caused by blade problems.",
        diySteps: [
            "DISCONNECT SPARK PLUG FIRST",
            "Inspect blade for bends, cracks, or damage",
            "Check blade balance",
            "Ensure blade bolt is tight"
        ],
        bringIn: true,
        bringInReason: "If the blade looks good but vibration continues, there may be crankshaft or deck damage."
    },
    'baseline-vibration': {
        title: "Excessive Baseline Vibration",
        severity: 'medium',
        description: "Some vibration is normal, but excessive vibration indicates a problem.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Continuous excessive vibration can indicate blade balance issues, bent crankshaft, or worn bearings. We can diagnose and repair the cause."
    },
    'internal-damage': {
        title: "Possible Internal Damage",
        severity: 'high',
        description: "Vibration with all external components in good condition suggests internal problems.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Internal damage such as bent crankshaft, worn bearings, or loose flywheel requires professional repair."
    },
    'deck-level': {
        title: "Check Deck Level",
        severity: 'diy-maybe',
        description: "An unlevel deck causes uneven cutting.",
        diySteps: [
            "Park on a flat, level surface",
            "Measure blade height at front, back, and sides",
            "Adjust deck according to owner's manual",
            "Front should be slightly lower than back (1/8\" - 1/4\")"
        ],
        bringIn: true,
        bringInReason: "If you can't get the deck level, or adjustment mechanisms are damaged, bring it in for service."
    },
    'check-wheels': {
        title: "Check Wheel Height Settings",
        severity: 'diy',
        description: "Uneven wheel settings cause uneven cuts.",
        diySteps: [
            "Check all wheel height adjusters are at the same setting",
            "Adjust any that are different",
            "Make sure adjustment levers are fully engaged"
        ],
        bringIn: false
    },
    'wheel-adjustment': {
        title: "Wheel Adjustment Problems",
        severity: 'diy-maybe',
        description: "The wheel adjustment mechanisms may be worn or damaged.",
        diySteps: [
            "Clean adjustment mechanisms",
            "Lubricate with silicone spray",
            "Check for damaged parts"
        ],
        bringIn: true,
        bringInReason: "If adjusters are damaged or won't hold position, they may need replacement."
    },
    'deck-belt': {
        title: "Deck Belt Issue",
        severity: 'medium',
        description: "The blade may not be spinning at full speed due to belt problems.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Belt inspection and replacement requires removing the deck on most mowers. We can inspect, adjust, or replace the belt system."
    },
    'damaged-blade': {
        title: "Replace Damaged Blade",
        severity: 'diy-maybe',
        description: "A damaged blade needs immediate replacement for safety and cut quality.",
        diySteps: [
            "Disconnect spark plug",
            "Remove and discard damaged blade",
            "Install correct replacement blade",
            "Torque blade bolt to specification"
        ],
        bringIn: true,
        bringInReason: "If you're not comfortable changing the blade, or if there's other damage, we can help. Always check for crankshaft damage after a blade strike."
    },
    'deck-buildup': {
        title: "Clean Under Deck",
        severity: 'diy-maybe',
        description: "Grass buildup under the deck affects airflow and cut quality.",
        diySteps: [
            "Tip mower properly (air filter side UP)",
            "Scrape grass buildup from under deck",
            "Clean discharge chute",
            "Consider a deck spray to prevent buildup"
        ],
        bringIn: true,
        bringInReason: "If cutting quality doesn't improve, there may be other issues with the blade or deck."
    },
    'burning-oil': {
        title: "Engine Burning Oil",
        severity: 'high',
        description: "Blue smoke indicates the engine is burning oil - this is a serious symptom.",
        diySteps: [
            "Check oil level - don't run if overfilled",
            "Stop using until inspected"
        ],
        bringIn: true,
        bringInReason: "Oil burning typically indicates worn piston rings, valve seals, or other internal engine wear. The engine needs professional evaluation to determine if repair is worthwhile."
    },
    'rich-mixture': {
        title: "Running Rich (Black Smoke)",
        severity: 'medium',
        description: "Black smoke means too much fuel and not enough air.",
        diySteps: [
            "Check air filter - replace if dirty",
            "Check choke is fully opening"
        ],
        bringIn: true,
        bringInReason: "If the air filter is clean and choke is working, the carburetor needs adjustment or service."
    },
    'head-gasket': {
        title: "Possible Head Gasket Failure",
        severity: 'high',
        description: "Continuous white smoke often indicates a blown head gasket.",
        diySteps: [
            "Stop running the engine",
            "Check oil for milky appearance (coolant contamination)"
        ],
        bringIn: true,
        bringInReason: "Head gasket replacement requires proper tools and technique. We can diagnose and repair head gasket issues."
    },
    'knock': {
        title: "Engine Knock",
        severity: 'high',
        description: "Knocking sounds indicate serious internal engine problems.",
        diySteps: [
            "STOP using immediately",
            "Check oil level"
        ],
        bringIn: true,
        bringInReason: "Engine knock typically indicates rod bearing failure, worn piston, or loose flywheel. Continued operation will cause catastrophic damage. Bring it in for evaluation."
    },
    'grinding': {
        title: "Grinding Noise",
        severity: 'high',
        description: "Metal-on-metal grinding indicates serious damage occurring.",
        diySteps: [
            "STOP using immediately"
        ],
        bringIn: true,
        bringInReason: "Grinding sounds mean metal parts are being damaged. Stop using the equipment and bring it in before the damage gets worse."
    },
    'bearing-issue': {
        title: "Bearing Problem",
        severity: 'medium',
        description: "A failing bearing causes squealing or grinding noises.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Bearings in the engine, spindles, or wheels may need replacement. We can identify which bearing is failing."
    },
    'valve-noise': {
        title: "Valve Train Noise",
        severity: 'medium',
        description: "Clicking from the engine often indicates valve adjustment is needed.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Valve adjustment requires specific procedures and measurements. We can properly adjust the valves to quiet the noise and ensure proper operation."
    },
    'general-noise': {
        title: "Unusual Engine Noise",
        severity: 'medium',
        description: "Engine noises should be diagnosed to prevent further damage.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Unusual noises can indicate various problems. It's better to have it checked than to continue running and risk more damage."
    },
    'internal-rattle': {
        title: "Internal Rattling",
        severity: 'medium',
        description: "Rattling with all external parts secure suggests internal looseness.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Internal rattles can be loose flywheel, worn timing components, or other internal issues. Professional diagnosis is needed."
    },
    'drive-cable': {
        title: "Drive Cable Issue",
        severity: 'diy-maybe',
        description: "The self-propel cable may need adjustment or replacement.",
        diySteps: [
            "Check cable at handle - is it moving freely?",
            "Look for frayed or stuck cable",
            "Adjust cable tension if adjustable"
        ],
        bringIn: true,
        bringInReason: "If cable adjustment doesn't help, the cable or internal components may need replacement."
    },
    'drive-gear': {
        title: "Drive Gear Problem",
        severity: 'medium',
        description: "Internal drive gears may be worn or damaged.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Drive gear replacement requires disassembly and proper parts. We can repair or replace the drive system."
    },
    'drive-belt': {
        title: "Drive Belt Issue",
        severity: 'diy-maybe',
        description: "The drive belt may be worn, loose, or broken.",
        diySteps: [
            "Locate and inspect the drive belt",
            "Check for wear, cracks, or stretching",
            "Replace if damaged"
        ],
        bringIn: true,
        bringInReason: "Belt replacement can be straightforward or complex depending on the model. We can replace the belt if needed."
    },
    'drive-check': {
        title: "Drive System Inspection Needed",
        severity: 'medium',
        description: "The drive system needs inspection to determine the problem.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Drive systems can have multiple components that might fail. We can diagnose and repair the issue."
    },
    'transmission': {
        title: "Transmission Problem",
        severity: 'high',
        description: "The transmission or transaxle may have internal damage.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Transmission repair is complex and often requires replacement. We can evaluate if repair is cost-effective."
    },
    'wheel-bearing': {
        title: "Wheel Bearing Issue",
        severity: 'medium',
        description: "Wheel bearings may be worn or damaged.",
        diySteps: [],
        bringIn: true,
        bringInReason: "We can inspect and replace wheel bearings to restore smooth operation."
    },
    'chain-brake': {
        title: "Check Chain Brake",
        severity: 'diy-maybe',
        description: "The chain brake may be engaged, preventing the chain from moving.",
        diySteps: [
            "Check if chain brake is engaged (front handle guard forward)",
            "Release chain brake by pulling guard back toward handle",
            "If chain still won't move, clutch may be the issue"
        ],
        bringIn: true,
        bringInReason: "If the chain brake is released but chain won't move, the clutch may need service."
    },
    'chain-replace': {
        title: "Chain Replacement Needed",
        severity: 'diy-maybe',
        description: "A damaged chain should be replaced for safety and performance.",
        diySteps: [
            "Purchase correct chain for your bar length and pitch",
            "Remove old chain, install new one with cutters facing forward",
            "Adjust tension properly"
        ],
        bringIn: true,
        bringInReason: "If you're unsure about the correct chain or installation, we can help. We stock common chains."
    },
    'oil-pump': {
        title: "Oil Pump Problem",
        severity: 'medium',
        description: "The automatic oiler pump may be failing.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Oil pump replacement requires disassembly and proper parts. Running a chainsaw without bar lubrication quickly ruins the bar and chain."
    },
    'clean-oil-port': {
        title: "Clean Bar Oil Port",
        severity: 'diy',
        description: "The oil port on the bar may be clogged with debris.",
        diySteps: [
            "Remove the bar and chain",
            "Clean the oil port hole with a small wire",
            "Clean the bar groove",
            "Reinstall and test"
        ],
        bringIn: false
    },
    'check-oil-port': {
        title: "Check Bar Oil Port",
        severity: 'diy-maybe',
        description: "Oil ports can get clogged with sawdust and debris.",
        diySteps: [
            "Remove the bar and look for the oil port (small hole)",
            "Clean with a small wire or compressed air",
            "Clean the bar rail groove while off"
        ],
        bringIn: true,
        bringInReason: "If cleaning the port doesn't restore oil flow, the oil pump may need service."
    },
    'clutch-issue': {
        title: "Clutch Problem",
        severity: 'medium',
        description: "The centrifugal clutch may be worn or damaged.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Clutch inspection and replacement requires special tools and expertise."
    },
    'head-damaged': {
        title: "Trimmer Head Damage",
        severity: 'diy-maybe',
        description: "The trimmer head may be cracked or damaged.",
        diySteps: [
            "Inspect head for cracks or damage",
            "Replace if damaged",
            "Make sure head is secured tightly"
        ],
        bringIn: true,
        bringInReason: "If you're not sure what type of head to get, or if the attachment point is damaged, bring it in."
    },
    'bump-feed': {
        title: "Bump Feed Not Working",
        severity: 'diy-maybe',
        description: "The bump feed mechanism may be clogged or worn.",
        diySteps: [
            "Remove spool and clean head thoroughly",
            "Check for broken springs or parts",
            "Make sure line isn't tangled or fused",
            "Reassemble and test"
        ],
        bringIn: true,
        bringInReason: "If cleaning doesn't help, the head may need replacement."
    },
    'line-breaking': {
        title: "Line Breaking Frequently",
        severity: 'diy',
        description: "Line breakage is usually caused by hitting hard objects or using wrong line.",
        diySteps: [
            "Use correct diameter line for your trimmer",
            "Avoid hitting fences, rocks, and concrete",
            "Keep line at proper length",
            "Store line properly to prevent brittleness"
        ],
        bringIn: false
    },
    'line-stuck': {
        title: "Line Won't Feed",
        severity: 'diy-maybe',
        description: "The line may be tangled or the head mechanism is stuck.",
        diySteps: [
            "Remove spool and untangle line",
            "Check that line isn't fused together (heat)",
            "Clean head mechanism",
            "Rewind line properly"
        ],
        bringIn: true,
        bringInReason: "If the mechanism is damaged, the head may need replacement."
    },
    'auto-feed': {
        title: "Auto-Feed Not Working",
        severity: 'diy-maybe',
        description: "Automatic line feed systems can get clogged or worn.",
        diySteps: [
            "Clean the head thoroughly",
            "Check for broken parts",
            "Ensure using correct line size"
        ],
        bringIn: true,
        bringInReason: "Auto-feed mechanisms can be complex. We can repair or replace the head if needed."
    },
    'impeller-issue': {
        title: "Impeller Problem",
        severity: 'medium',
        description: "The impeller (the fast-spinning fan) may be damaged or not engaging.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Impeller issues require significant disassembly. The impeller key, shaft, or bearings may need service."
    },
    'auger-bearing': {
        title: "Auger Bearing Issue",
        severity: 'medium',
        description: "The auger bearings may be worn, causing grinding.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Auger bearing replacement requires proper parts and tools."
    },
    'auger-damage': {
        title: "Auger Damage",
        severity: 'high',
        description: "The auger is physically damaged and needs repair or replacement.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Bent or damaged augers affect performance and can damage other components. We can repair or replace the auger."
    },
    'impeller-clearance': {
        title: "Impeller Clearance Issue",
        severity: 'medium',
        description: "The impeller may have too much clearance from the housing, reducing throw distance.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Impeller clearance adjustment or impeller kit installation can restore throwing power."
    },
    'chute-gear': {
        title: "Chute Rotation Problem",
        severity: 'diy-maybe',
        description: "The chute rotation mechanism may need adjustment or repair.",
        diySteps: [
            "Check for ice buildup preventing rotation",
            "Lubricate pivot points",
            "Check cable/gear mechanism for damage"
        ],
        bringIn: true,
        bringInReason: "If lubrication doesn't help, the gear mechanism may need repair or replacement."
    },
    'chute-damage': {
        title: "Chute Damage",
        severity: 'medium',
        description: "The discharge chute is damaged and needs repair or replacement.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Chutes can crack from impacts or cold. We can source replacement parts."
    },
    'inlet-filter': {
        title: "Check Inlet Filter",
        severity: 'diy',
        description: "The water inlet filter may be clogged.",
        diySteps: [
            "Turn off water and disconnect hose",
            "Remove inlet filter screen",
            "Clean thoroughly",
            "Reinstall and test"
        ],
        bringIn: false
    },
    'pump-issue': {
        title: "Pump Problem",
        severity: 'high',
        description: "The high-pressure pump may have internal damage.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Pressure washer pumps can fail from running dry, freezing, or wear. Pump repair or replacement requires expertise."
    },
    'check-nozzle': {
        title: "Check Nozzle First",
        severity: 'diy',
        description: "A clogged nozzle is the most common cause of pressure loss.",
        diySteps: [
            "Remove the nozzle from the wand",
            "Clear any debris with a small wire",
            "Rinse and reinstall",
            "Try a different nozzle if available"
        ],
        bringIn: true,
        bringInReason: "If the nozzle is clear but pressure is still low, there's a more serious issue."
    },
    'check-supply': {
        title: "Verify Water Supply",
        severity: 'diy',
        description: "Inadequate water supply causes low pressure and pump damage.",
        diySteps: [
            "Use a larger diameter hose (3/4\" is best)",
            "Check hose for kinks",
            "Make sure the tap is fully open",
            "Try a shorter hose run"
        ],
        bringIn: true,
        bringInReason: "If water supply is good but pressure is low, the pump may need service."
    },
    'unloader-valve': {
        title: "Unloader Valve Issue",
        severity: 'medium',
        description: "The unloader valve controls pressure and may need adjustment or replacement.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Unloader valve adjustment requires proper technique. Incorrect adjustment can damage the pump."
    },
    'air-in-line': {
        title: "Air in System",
        severity: 'diy-maybe',
        description: "Air trapped in the system causes pulsing pressure.",
        diySteps: [
            "Make sure water supply is continuous and adequate",
            "Squeeze the trigger with pump off to purge air",
            "Check hose connections for leaks (air entry)",
            "Run water through before starting engine"
        ],
        bringIn: true,
        bringInReason: "If pulsing continues, the pump valves may need service."
    },
    'unloader-issue': {
        title: "Unloader Adjustment Needed",
        severity: 'medium',
        description: "The unloader valve may need adjustment or replacement.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Proper unloader adjustment is critical for pump longevity and performance."
    },
    'stuck-valve': {
        title: "Stuck Valve",
        severity: 'medium',
        description: "Internal valves may be stuck from lack of use or contamination.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Pump valve service requires disassembly and proper parts."
    },
    'pump-seals': {
        title: "Pump Seal Failure",
        severity: 'high',
        description: "Internal pump seals are leaking.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Pump seal replacement requires proper parts and technique. Depending on damage, pump rebuild or replacement may be needed."
    },
    'gun-leak': {
        title: "Spray Gun Leak",
        severity: 'diy-maybe',
        description: "The spray gun may have worn seals or connections.",
        diySteps: [
            "Check and tighten all connections",
            "Inspect O-rings in gun assembly",
            "Replace worn O-rings"
        ],
        bringIn: true,
        bringInReason: "If the gun is leaking internally, it may need replacement."
    },
    'avr-issue': {
        title: "AVR or Alternator Problem",
        severity: 'high',
        description: "The Automatic Voltage Regulator (AVR) or alternator may be faulty.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Electrical generation issues require specialized testing and parts."
    },
    'avr-adjustment': {
        title: "Voltage Regulation Issue",
        severity: 'medium',
        description: "The generator's voltage output needs adjustment or repair.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Voltage adjustment and AVR testing requires proper equipment."
    },
    'carburetor-gen': {
        title: "Carburetor Service Needed",
        severity: 'medium',
        description: "Generator surging is often caused by carburetor issues.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Carburetor cleaning and adjustment will usually resolve surging issues."
    },
    'governor-gen': {
        title: "Governor Adjustment Needed",
        severity: 'medium',
        description: "The governor system may need adjustment for stable power under load.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Generator governors must be properly adjusted for stable voltage output."
    },
    'idle-adjustment': {
        title: "Idle Adjustment Needed",
        severity: 'medium',
        description: "The engine idle speed needs adjustment.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Generator idle speed affects voltage output. We can properly adjust the idle circuit."
    },
    'engine-other': {
        title: "Engine Issue - Diagnosis Needed",
        severity: 'medium',
        description: "Your engine problem needs professional evaluation.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Bring your equipment in for a thorough engine diagnosis. We can identify the problem and provide repair options."
    },
    'mechanical-other': {
        title: "Mechanical Issue - Diagnosis Needed",
        severity: 'medium',
        description: "Mechanical problems with moving parts need inspection.",
        diySteps: [],
        bringIn: true,
        bringInReason: "We can inspect the mechanical components and determine what needs repair or replacement."
    },
    'electrical-other': {
        title: "Electrical Issue - Diagnosis Needed",
        severity: 'high',
        description: "Electrical problems require proper testing equipment.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Electrical issues can be complex. We have the equipment to properly test and diagnose electrical problems."
    },
    'body-other': {
        title: "Body/Frame Damage",
        severity: 'medium',
        description: "Physical damage to the equipment body or frame.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Depending on the damage, we may be able to repair or source replacement parts."
    },
    'unknown-other': {
        title: "Unknown Problem - Diagnosis Needed",
        severity: 'high',
        description: "When you're not sure what's wrong, professional diagnosis is the best approach.",
        diySteps: [],
        bringIn: true,
        bringInReason: "Bring your equipment in and we'll diagnose the problem. It's better to identify issues before they cause more damage."
    }
};

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function startDiagnosis() {
    history = ['welcome-screen'];
    showScreen('equipment-screen');
}

function goBack() {
    if (history.length > 0) {
        const previousScreen = history.pop();

        // Reset state based on where we're going back to
        if (previousScreen === 'welcome-screen') {
            currentEquipment = null;
            currentProblem = null;
            currentQuestionIndex = 0;
            answers = [];
        } else if (previousScreen === 'equipment-screen') {
            currentProblem = null;
            currentQuestionIndex = 0;
            answers = [];
        } else if (previousScreen === 'problem-screen') {
            currentQuestionIndex = 0;
            answers = [];
        } else if (previousScreen === 'question-screen') {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                answers.pop();
            }
        }

        showScreen(previousScreen);

        // Re-render the question if going back to question screen
        if (previousScreen === 'question-screen') {
            renderQuestion();
        }
    }
}

function selectEquipment(equipment) {
    history.push('equipment-screen');
    currentEquipment = equipment;
    renderProblems();
    showScreen('problem-screen');
}

function renderProblems() {
    const container = document.getElementById('problem-options');
    const problems = problemCategories[currentEquipment] || problemCategories['other'];

    container.innerHTML = problems.map(problem => `
        <button class="option-btn" onclick="selectProblem('${problem.id}')">
            ${problem.text}
        </button>
    `).join('');
}

function selectProblem(problemId) {
    history.push('problem-screen');
    currentProblem = problemId;
    currentQuestionIndex = 0;
    answers = [];

    // Check if we have a diagnostic tree for this problem
    if (diagnosticTrees[problemId]) {
        renderQuestion();
        showScreen('question-screen');
    } else {
        // If no specific tree, show a generic "bring it in" result
        showResult('unknown-other');
    }
}

function renderQuestion() {
    const tree = diagnosticTrees[currentProblem];
    if (!tree || currentQuestionIndex >= tree.length) {
        showResult('carburetor'); // Default fallback
        return;
    }

    const question = tree[currentQuestionIndex];

    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / tree.length) * 100;
    document.getElementById('progress-fill').style.width = `${Math.min(progress, 100)}%`;

    // Render question
    document.getElementById('question-text').textContent = question.question;

    // Render options
    const container = document.getElementById('answer-options');
    container.innerHTML = question.options.map((option, index) => `
        <button class="option-btn" onclick="selectAnswer(${index})">
            ${option.text}
        </button>
    `).join('');
}

function selectAnswer(optionIndex) {
    const tree = diagnosticTrees[currentProblem];
    const question = tree[currentQuestionIndex];
    const option = question.options[optionIndex];

    answers.push({
        question: question.question,
        answer: option.text
    });

    // Check if this leads to a result
    if (typeof option.next === 'string') {
        // Check if it's a redirect to another problem tree
        if (diagnosticTrees[option.next]) {
            currentProblem = option.next;
            currentQuestionIndex = 0;
            history.push('question-screen');
            renderQuestion();
        } else {
            // It's a result
            showResult(option.next);
        }
    } else {
        // It's a next question index
        history.push('question-screen');
        currentQuestionIndex = option.next;
        renderQuestion();
    }
}

function showResult(resultId) {
    const result = diagnosisResults[resultId];
    if (!result) {
        showResult('unknown-other');
        return;
    }

    const container = document.getElementById('results-content');

    let severityClass = '';
    let severityText = '';
    let severityIcon = '';

    switch(result.severity) {
        case 'diy':
            severityClass = 'severity-diy';
            severityText = 'DIY Fix';
            severityIcon = '✅';
            break;
        case 'diy-maybe':
            severityClass = 'severity-diy-maybe';
            severityText = 'Possible DIY Fix';
            severityIcon = '🔧';
            break;
        case 'medium':
            severityClass = 'severity-medium';
            severityText = 'Professional Service Recommended';
            severityIcon = '⚠️';
            break;
        case 'high':
            severityClass = 'severity-high';
            severityText = 'Professional Service Required';
            severityIcon = '🔴';
            break;
    }

    let html = `
        <div class="result-header ${severityClass}">
            <span class="severity-icon">${severityIcon}</span>
            <h2>${result.title}</h2>
            <span class="severity-badge">${severityText}</span>
        </div>

        <div class="result-description">
            <p>${result.description}</p>
        </div>
    `;

    if (result.diySteps && result.diySteps.length > 0) {
        html += `
            <div class="diy-steps">
                <h3>What You Can Try:</h3>
                <ol>
                    ${result.diySteps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    if (result.note) {
        html += `
            <div class="result-note">
                <strong>Note:</strong> ${result.note}
            </div>
        `;
    }

    if (result.bringIn) {
        html += `
            <div class="bring-in-section">
                <h3>🏪 When to Bring It to Morrill's Motors:</h3>
                <p>${result.bringInReason}</p>
                <div class="contact-cta">
                    <p><strong>Ready to get it fixed right?</strong></p>
                    <p>Bring your equipment to Morrill's Motors for professional diagnosis and repair.</p>
                    <p class="cta-phone">📞 (435) 263-4252</p>
                    <a href="https://morrillsmotors.com/contact" class="btn-contact" target="_blank">Request Service Online</a>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="success-section">
                <p>✅ This is usually something you can fix yourself with basic tools.</p>
                <p>If you're still having trouble, or if you'd prefer professional service, we're here to help!</p>
            </div>
        `;
    }

    container.innerHTML = html;
    showScreen('results-screen');
}

function restartDiagnosis() {
    currentEquipment = null;
    currentProblem = null;
    currentQuestionIndex = 0;
    answers = [];
    history = [];
    showScreen('welcome-screen');
}
