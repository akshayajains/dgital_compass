export interface VastuZone {
  code: string;
  nameHi: string;
  nameEn: string;
  element: 'Water' | 'Air' | 'Fire' | 'Earth' | 'Space';
  elementHi: string;
  startDeg: number;
  endDeg: number;
  centerDeg: number;
  deity: string;
  color: string;
  accentColor: string;
  idealFor: { en: string[]; hi: string[] };
  avoidFor: { en: string[]; hi: string[] };
  energyDescEn: string;
  energyDescHi: string;
}

export interface RoomGuidance {
  id: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  idealZones: string[];
  acceptableZones: string[];
  negativeZones: string[];
  bestFacingEn: string;
  bestFacingHi: string;
  keyRulesEn: string[];
  keyRulesHi: string[];
  colorsEn: string;
  colorsHi: string;
  remediesEn: string[];
  remediesHi: string[];
}

export const VASTU_16_ZONES: VastuZone[] = [
  {
    code: 'N',
    nameEn: 'North',
    nameHi: 'उत्तर (कुबेर)',
    element: 'Water',
    elementHi: 'जल तत्व',
    startDeg: 348.75,
    endDeg: 11.25,
    centerDeg: 0,
    deity: 'Lord Kuber (God of Wealth)',
    color: '#38BDF8',
    accentColor: 'text-sky-400',
    idealFor: {
      en: ['Main Entrance (N3, N4)', 'Locker & Cash Box', 'Living Room', 'Underground Water Tank', 'Mirror on North Wall'],
      hi: ['मुख्य द्वार (N3, N4)', 'तिजोरी व धन स्थान', 'बैठक कक्ष', 'भूमिगत जल टैंक', 'उत्तर दीवार पर दर्पण']
    },
    avoidFor: {
      en: ['Kitchen (Fire destroys water)', 'Toilet (Drains wealth)', 'Heavy Storage / Overhead Tank', 'Red/Pink Colors'],
      hi: ['रसोई (अग्नि जल को नष्ट करती है)', 'शौचालय (धन हानि)', 'भारी सामान / ओवरहेड टैंक', 'लाल/गुलाबी रंग']
    },
    energyDescEn: 'Zone of Money, Growth, Career & New Opportunities. Governed by Mercury & Kuber.',
    energyDescHi: 'धन, समृद्धि, आजीविका एवं नए अवसरों का क्षेत्र। स्वामी बुध एवं कुबेर।'
  },
  {
    code: 'NNE',
    nameEn: 'North-North-East',
    nameHi: 'उत्तर-उत्तर-पूर्व (स्वास्थ्य)',
    element: 'Water',
    elementHi: 'जल तत्व',
    startDeg: 11.25,
    endDeg: 33.75,
    centerDeg: 22.5,
    deity: 'Dhanvantari (God of Medicine)',
    color: '#06B6D4',
    accentColor: 'text-cyan-400',
    idealFor: {
      en: ['Medicine Cabinet', 'Healing & Recovery Room', 'Yoga / Meditation Space', 'Lightweight Green Plants'],
      hi: ['दवाइयों की अलमारी', 'रोग मुक्ति कक्ष', 'योग व ध्यान कक्ष', 'हल्के हरे पौधे']
    },
    avoidFor: {
      en: ['Toilet (Causes chronic diseases)', 'Dustbin / Clutter', 'Kitchen Fire', 'Dark Red/Black Colors'],
      hi: ['शौचालय (गंभीर रोग कारक)', 'कचरा / कबाड़', 'रसोई की अग्नि', 'गहरा लाल/काला रंग']
    },
    energyDescEn: 'Zone of Health, Immunity & Physical Healing. Keeps family members disease-free.',
    energyDescHi: 'स्वास्थ्य, रोग प्रतिरोधक क्षमता एवं आरोग्य का क्षेत्र।'
  },
  {
    code: 'NE',
    nameEn: 'North-East (Ishanya)',
    nameHi: 'ईशान (देव स्थान)',
    element: 'Water',
    elementHi: 'जल/आकाश तत्व',
    startDeg: 33.75,
    endDeg: 56.25,
    centerDeg: 45,
    deity: 'Lord Shiva & Brihaspati',
    color: '#FACC15',
    accentColor: 'text-yellow-400',
    idealFor: {
      en: ['Pooja Mandir (Best in house)', 'Meditation & Spiritual Practice', 'Study Table for High Focus', 'Clean Water Fountain'],
      hi: ['पूजा घर (सर्वश्रेष्ठ)', 'ध्यान व आध्यात्मिक साधना', 'अध्ययन कक्ष (उच्च एकाग्रता)', 'पवित्र जल फव्वारा']
    },
    avoidFor: {
      en: ['Toilet (Major Vastu Dosha - mental stress)', 'Kitchen / Gas Stove', 'Heavy Staircase', 'Master Bedroom'],
      hi: ['शौचालय (महा वास्तु दोष - मानसिक अशांति)', 'रसोई / चूल्हा', 'भारी सीढ़ी', 'मास्टर बेडरूम']
    },
    energyDescEn: 'Most Sacred Zone. Source of Cosmic Energy, Mental Clarity, Wisdom & Divine Blessings.',
    energyDescHi: 'घर का सर्वाधिक पवित्र कोण। मानसिक स्पष्टता, दूरदर्शिता एवं ईश्वरीय कृपा का वास।'
  },
  {
    code: 'ENE',
    nameEn: 'East-North-East',
    nameHi: 'पूर्व-उत्तर-पूर्व (आनंद)',
    element: 'Air',
    elementHi: 'वायु तत्व',
    startDeg: 56.25,
    endDeg: 78.75,
    centerDeg: 67.5,
    deity: 'Parjanya (Rain God)',
    color: '#34D399',
    accentColor: 'text-emerald-400',
    idealFor: {
      en: ['Recreation Room / Family Lounge', 'Children Play Area', 'Spa / Jacuzzi', 'Light Green decor'],
      hi: ['मनोरंजन कक्ष / फैमिली लाउंज', 'बच्चों का खेल क्षेत्र', 'स्नान व ताजगी', 'हल्का हरा रंग']
    },
    avoidFor: {
      en: ['Toilet / Clutter (Causes depression & boredom)', 'Heavy Storage', 'Dark Grim Colors'],
      hi: ['शौचालय / कबाड़ (अवसाद व नीरसता)', 'भारी गोदाम', 'गहरे उदास रंग']
    },
    energyDescEn: 'Zone of Joy, Happiness, Recreation & Rejuvenation. Keeps household cheerful.',
    energyDescHi: 'उमंग, मनोरंजन, ताजगी एवं आनंद का क्षेत्र।'
  },
  {
    code: 'E',
    nameEn: 'East',
    nameHi: 'पूर्व (इंद्र / सूर्य)',
    element: 'Air',
    elementHi: 'वायु तत्व',
    startDeg: 78.75,
    endDeg: 101.25,
    centerDeg: 90,
    deity: 'Lord Indra & Surya Dev',
    color: '#10B981',
    accentColor: 'text-emerald-400',
    idealFor: {
      en: ['Main Entrance (E3, E4)', 'Living Room / Drawing Room', 'Study Room (Facing East)', 'Large Windows / Sunlight'],
      hi: ['मुख्य द्वार (E3, E4)', 'बैठक कक्ष', 'अध्ययन कक्ष (पूर्व मुखी)', 'बड़ी खिड़कियां / सूर्य प्रकाश']
    },
    avoidFor: {
      en: ['Toilet (Destroys social connectivity)', 'Heavy Wardrobes blocking light', 'Kitchen on pure East'],
      hi: ['शौचालय (सामाजिक संपर्क भंग)', 'भारी अलमारी', 'पूर्ण पूर्व में रसोई']
    },
    energyDescEn: 'Zone of Social Connectivity, Government Contacts, Influence & Fame. Source of life-giving prana.',
    energyDescHi: 'सामाजिक संबंध, मान-सम्मान, सरकारी संपर्क एवं प्राण ऊर्जा का केंद्र।'
  },
  {
    code: 'ESE',
    nameEn: 'East-South-East',
    nameHi: 'पूर्व-दक्षिण-पूर्व (मंथन)',
    element: 'Air',
    elementHi: 'वायु तत्व',
    startDeg: 101.25,
    endDeg: 123.75,
    centerDeg: 112.5,
    deity: 'Bhrisha',
    color: '#14B8A6',
    accentColor: 'text-teal-400',
    idealFor: {
      en: ['Mixer/Grinder / Food Preparation', 'Washing Machine', 'Analytical Work & Deep Research'],
      hi: ['मिक्सी / भोजन मंथन', 'वाशिंग मशीन', 'गहन शोध एवं विश्लेषण']
    },
    avoidFor: {
      en: ['Bedroom (Causes endless overthinking & insomnia)', 'Mandir', 'Main Entrance (Anxiety & debts)'],
      hi: ['शयनकक्ष (अत्यधिक चिंता व अनिद्रा)', 'पूजा घर', 'मुख्य द्वार (तनाव व कर्ज़)']
    },
    energyDescEn: 'Zone of Churning, Analysis & Deep Thinking. Avoid sleeping here to prevent anxiety.',
    energyDescHi: 'मंथन, विश्लेषण एवं विचार विमर्श का क्षेत्र। यहाँ सोने से बचें।'
  },
  {
    code: 'SE',
    nameEn: 'South-East (Agneya)',
    nameHi: 'आग्नेय (अग्नि कोण)',
    element: 'Fire',
    elementHi: 'अग्नि तत्व',
    startDeg: 123.75,
    endDeg: 146.25,
    centerDeg: 135,
    deity: 'Lord Agni & Venus (Shukra)',
    color: '#F97316',
    accentColor: 'text-orange-400',
    idealFor: {
      en: ['Kitchen Gas Stove (Best in house)', 'Electrical Inverter / Panel Board', 'Cash Flow & Daily Sales Register'],
      hi: ['रसोई गैस चूल्हा (सर्वश्रेष्ठ)', 'इन्वर्टर / विद्युत पैनल', 'दैनिक नकदी रोकड़']
    },
    avoidFor: {
      en: ['Water Tank / Borewell (Water kills Fire - financial crash)', 'Master Bedroom', 'Toilet', 'Blue/Black Colors'],
      hi: ['जल टैंक / बोरवेल (अग्नि-जल वैर - धन नाश)', 'मास्टर बेडरूम', 'शौचालय', 'नीला/काला रंग']
    },
    energyDescEn: 'Zone of Cash Liquidity, Fire, Zeal, Passion & Wealth. Governed by Venus & Agni.',
    energyDescHi: 'नकदी धन, उत्साह, तेज एवं गृहलक्ष्मी का क्षेत्र। स्वामी अग्नि व शुक्र।'
  },
  {
    code: 'SSE',
    nameEn: 'South-South-East',
    nameHi: 'दक्षिण-दक्षिण-पूर्व (शक्ति)',
    element: 'Fire',
    elementHi: 'अग्नि तत्व',
    startDeg: 146.25,
    endDeg: 168.75,
    centerDeg: 157.5,
    deity: 'Pushan',
    color: '#FB923C',
    accentColor: 'text-orange-300',
    idealFor: {
      en: ['Gym / Workout Room', 'Power Yoga / Martial Arts', 'Food Storage', 'Red/Orange Accents'],
      hi: ['व्यायामशाला / जिम', 'शारीरिक साधना', 'अन्न भंडारण', 'नारंगी/लाल रंग']
    },
    avoidFor: {
      en: ['Toilet (Destroys physical stamina)', 'Underground Water Tank', 'Clutter & Junk'],
      hi: ['शौचालय (शारीरिक बल क्षीण)', 'भूमिगत पानी टैंक', 'कचरा']
    },
    energyDescEn: 'Zone of Confidence, Physical Strength, Stamina & Mental Fortitude.',
    energyDescHi: 'आत्मविश्वास, शारीरिक बल, ऊर्जा एवं आंतरिक शक्ति का क्षेत्र।'
  },
  {
    code: 'S',
    nameEn: 'South',
    nameHi: 'दक्षिण (यम / मंगल)',
    element: 'Fire',
    elementHi: 'अग्नि/पृथ्वी तत्व',
    startDeg: 168.75,
    endDeg: 191.25,
    centerDeg: 180,
    deity: 'Lord Yama & Mangal (Mars)',
    color: '#EF4444',
    accentColor: 'text-red-400',
    idealFor: {
      en: ['Bedroom (Best for deep restful sleep)', 'Relaxation Room', 'Heavy Furniture', 'Head Placement While Sleeping'],
      hi: ['शयनकक्ष (गहरी व शांत नींद)', 'विश्राम कक्ष', 'भारी फर्नीचर', 'सोते समय सिर की दिशा']
    },
    avoidFor: {
      en: ['Main Entrance (Unless S3, S4)', 'Water Fountain / Aquarium', 'Underground Tank', 'Light Open Spaces'],
      hi: ['मुख्य द्वार (S3, S4 को छोड़कर)', 'फव्वारा / एक्वेरियम', 'भूमिगत जल टैंक', 'खुला व नीचा स्थान']
    },
    energyDescEn: 'Zone of Fame, Recognition, Rest & Deep Peaceful Sleep. Head facing South gives health & longevity.',
    energyDescHi: 'यश, कीर्ति, विश्राम एवं गहरी नींद। दक्षिण सिर करके सोने से दीर्घायु प्राप्त होती है।'
  },
  {
    code: 'SSW',
    nameEn: 'South-South-West',
    nameHi: 'दक्षिण-दक्षिण-पश्चिम (विसर्जन)',
    element: 'Earth',
    elementHi: 'पृथ्वी तत्व',
    startDeg: 191.25,
    endDeg: 213.75,
    centerDeg: 202.5,
    deity: 'Gandharva',
    color: '#A855F7',
    accentColor: 'text-purple-400',
    idealFor: {
      en: ['Toilet & Septic Tank (Best place in house)', 'Waste Disposal / Dustbin', 'Draining negative energy'],
      hi: ['शौचालय व सेप्टिक टैंक (सर्वश्रेष्ठ स्थान)', 'कचरा पेटी / निष्कासन', 'नकारात्मक ऊर्जा निष्कासन']
    },
    avoidFor: {
      en: ['Master Bedroom (Weakens relationships & health)', 'Study Room', 'Mandir', 'Safe / Cash Box'],
      hi: ['मास्टर बेडरूम (संबंध व स्वास्थ्य हानि)', 'अध्ययन कक्ष', 'पूजा घर', 'तिजोरी']
    },
    energyDescEn: 'Zone of Disposal, Waste Elimination & Letting Go. Ideal for toilet to flush out toxicity.',
    energyDescHi: 'विसर्जन, निष्कासन एवं त्याग का क्षेत्र। शौचालय के लिए सर्वश्रेष्ठ।'
  },
  {
    code: 'SW',
    nameEn: 'South-West (Nairutya)',
    nameHi: 'नैऋत्य (स्थायित्व)',
    element: 'Earth',
    elementHi: 'पृथ्वी तत्व',
    startDeg: 213.75,
    endDeg: 236.25,
    centerDeg: 225,
    deity: 'Lord Nirriti & Rahu',
    color: '#F59E0B',
    accentColor: 'text-amber-400',
    idealFor: {
      en: ['Master Bedroom (Head of family)', 'Overhead Heavy Water Tank', 'Tool Storage & Skill Books', 'Tall Heavy Walls'],
      hi: ['मास्टर बेडरूम (गृहस्वामी कक्ष)', 'भारी ओवरहेड पानी टंकी', 'औजार व कौशल साधन', 'ऊंची व भारी दीवारें']
    },
    avoidFor: {
      en: ['Toilet (Ruptures family relations & stability)', 'Underground Tank / Borewell', 'Pooja Mandir', 'Main Entrance'],
      hi: ['शौचालय (पारिवारिक कलह व अस्थिरता)', 'भूमिगत टैंक / बोरवेल', 'पूजा घर', 'मुख्य द्वार']
    },
    energyDescEn: 'Zone of Stability, Relationships, Skill Mastery & Leadership. Most grounded quadrant.',
    energyDescHi: 'स्थायित्व, दांपत्य संबंध, दक्षता एवं नेतृत्व क्षमता का क्षेत्र।'
  },
  {
    code: 'WSW',
    nameEn: 'West-South-West',
    nameHi: 'पश्चिम-दक्षिण-पश्चिम (विद्या)',
    element: 'Space',
    elementHi: 'आकाश तत्व',
    startDeg: 236.25,
    endDeg: 258.75,
    centerDeg: 247.5,
    deity: 'Sugriva / Dauvarika',
    color: '#818CF8',
    accentColor: 'text-indigo-400',
    idealFor: {
      en: ['Study Room & Study Table', 'Bookshelf & Academic Certificates', 'Savings Bank Passbooks & Fixed Deposits'],
      hi: ['अध्ययन कक्ष व स्टडी टेबल', 'पुस्तकालय व प्रमाण पत्र', 'बचत खाता पासबुक व एफडी']
    },
    avoidFor: {
      en: ['Toilet (Washes away education & savings)', 'Kitchen Fire', 'Dustbin / Junk'],
      hi: ['शौचालय (विद्या व बचत का क्षय)', 'रसोई की आग', 'कचरा']
    },
    energyDescEn: 'Zone of Education, Knowledge, Savings & Skill Retention. Best for student desks.',
    energyDescHi: 'विद्या, ज्ञान, स्मरण शक्ति एवं बचत का पावन क्षेत्र। छात्रों के लिए सर्वोत्तम।'
  },
  {
    code: 'W',
    nameEn: 'West',
    nameHi: 'पश्चिम (वरुण / शनि)',
    element: 'Space',
    elementHi: 'आकाश तत्व',
    startDeg: 258.75,
    endDeg: 281.25,
    centerDeg: 270,
    deity: 'Lord Varuna & Shani (Saturn)',
    color: '#6366F1',
    accentColor: 'text-indigo-400',
    idealFor: {
      en: ['Main Entrance (W3, W4)', 'Dining Room', 'Business Profits / Target Boards', 'Overhead Tank', 'Children Bedroom'],
      hi: ['मुख्य द्वार (W3, W4)', 'भोजन कक्ष (डाइनिंग)', 'व्यापार लाभ व लक्ष्य बोर्ड', 'ओवरहेड टैंक', 'संतान कक्ष']
    },
    avoidFor: {
      en: ['Pooja Mandir in North-West', 'Underground Water Tank', 'Low Boundary Walls'],
      hi: ['भूमिगत जल टैंक', 'नीची चारदीवारी']
    },
    energyDescEn: 'Zone of Profits, Gains, Fulfillment of Desires & Business Growth. Governed by Saturn & Varuna.',
    energyDescHi: 'लाभ, प्राप्तियां, मनोकामना पूर्ति एवं व्यापारिक सफलता का क्षेत्र।'
  },
  {
    code: 'WNW',
    nameEn: 'West-North-West',
    nameHi: 'पश्चिम-उत्तर-पश्चिम (रुदन / डिटॉक्स)',
    element: 'Air',
    elementHi: 'वायु तत्व',
    startDeg: 281.25,
    endDeg: 303.75,
    centerDeg: 292.5,
    deity: 'Shosha / Asura',
    color: '#94A3B8',
    accentColor: 'text-slate-400',
    idealFor: {
      en: ['Detoxification Space', 'Crying Room / Emotional Venting', 'Waste Paper Storage', 'Toilet (Acceptable)'],
      hi: ['डिटॉक्स कक्ष', 'भावनात्मक विरेचन स्थान', 'रद्दी कागजात भंडारण', 'शौचालय (स्वीकार्य)']
    },
    avoidFor: {
      en: ['Bedroom (Causes chronic sadness & depression)', 'Study Room', 'Locker', 'Mandir'],
      hi: ['शयनकक्ष (गहरा विषाद व उदासी)', 'अध्ययन कक्ष', 'तिजोरी', 'पूजा घर']
    },
    energyDescEn: 'Zone of Detoxification, Grief Release & Emotional Venting. Cleans past mental baggage.',
    energyDescHi: 'विरेचन, डिटॉक्स एवं मानसिक भार मुक्ति का क्षेत्र।'
  },
  {
    code: 'NW',
    nameEn: 'North-West (Vayavya)',
    nameHi: 'वायव्य (वायु कोण)',
    element: 'Air',
    elementHi: 'वायु तत्व',
    startDeg: 303.75,
    endDeg: 326.25,
    centerDeg: 315,
    deity: 'Lord Vayu & Chandra (Moon)',
    color: '#38BDF8',
    accentColor: 'text-sky-400',
    idealFor: {
      en: ['Guest Bedroom', 'Finished Goods Ready for Sale', 'Support Staff Room', 'Banking & Loan Documents'],
      hi: ['अतिथि कक्ष', 'बिक्री हेतु तैयार माल', 'सहायक स्टाफ कक्ष', 'बैंक व ऋण दस्तावेज']
    },
    avoidFor: {
      en: ['Master Bedroom (Frequent travel, unsettled mind)', 'Heavy Permanent Storage', 'Mandir'],
      hi: ['मास्टर बेडरूम (अस्थिर मन व अत्यधिक प्रवास)', 'भारी स्थायी भंडारण']
    },
    energyDescEn: 'Zone of Support, Banking, Helpful People & Movement. Speeds up inventory turnover.',
    energyDescHi: 'सहयोग, सहायता, बैंकिंग एवं गतिशीलता का क्षेत्र।'
  },
  {
    code: 'NNW',
    nameEn: 'North-North-West',
    nameHi: 'उत्तर-उत्तर-पश्चिम (आकर्षण)',
    element: 'Water',
    elementHi: 'जल तत्व',
    startDeg: 326.25,
    endDeg: 348.75,
    centerDeg: 337.5,
    deity: 'Roga / Naga',
    color: '#0284C7',
    accentColor: 'text-sky-500',
    idealFor: {
      en: ['Newly Married Couple Bedroom', 'Attraction & Charm Products', 'Perfume & Wardrobe Dressers'],
      hi: ['नवविवाहित युगल कक्ष', 'आकर्षण व सौंदर्य प्रसाधन', 'इत्र व वस्त्र सज्जा']
    },
    avoidFor: {
      en: ['Children Study Room (Distracts mind)', 'Toilet (Kills marital warmth)', 'Mandir'],
      hi: ['बच्चों का अध्ययन कक्ष (ध्यान भटकना)', 'शौचालय (दांपत्य में दूरी)', 'पूजा घर']
    },
    energyDescEn: 'Zone of Attraction, Sex, Charm & Sensual Pleasure. Enhances romantic harmony.',
    energyDescHi: 'आकर्षण, काम, सौंदर्य एवं वैवाहिक सुख का क्षेत्र।'
  }
];

export const ROOM_GUIDANCE_CATALOG: RoomGuidance[] = [
  {
    id: 'master_bedroom',
    nameEn: 'Master Bedroom',
    nameHi: 'मास्टर बेडरूम (गृहस्वामी कक्ष)',
    icon: '🛏️',
    idealZones: ['SW', 'S', 'W'],
    acceptableZones: ['NW'],
    negativeZones: ['NE', 'SE', 'SSW', 'ESE', 'WNW'],
    bestFacingEn: 'Head facing South (Best) or East. Never sleep with head to North.',
    bestFacingHi: 'सिर हमेशा दक्षिण (सर्वोत्तम) या पूर्व में रखें। उत्तर की ओर सिर करके कभी न सोएं।',
    keyRulesEn: [
      'Master bedroom in South-West grants authority, stability and strong leadership to the family head.',
      'Head towards South aligns with Earth\'s magnetic field, reducing heart strain, headaches and boosting deep REM sleep.',
      'Never place a mirror directly reflecting the bed; cover with a curtain at night to prevent health issues.',
      'Bed should be made of solid natural wood, not metal. Leave space on both sides for balanced energy.',
      'Avoid exposed overhead beams above the bed (causes chronic tension and stress).'
    ],
    keyRulesHi: [
      'नैऋत्य (SW) में मास्टर बेडरूम गृहस्वामी को स्थायित्व, नेतृत्व और दांपत्य सुख प्रदान करता है।',
      'दक्षिण सिर करके सोने से पृथ्वी के चुंबकीय प्रवाह से तालमेल बैठता है, जिससे गहरी शांत नींद और दीर्घायु मिलती है।',
      'पलंग के सामने ऐसा दर्पण न हो जिसमें सोते समय शरीर दिखे; रात को दर्पण पर पर्दा डालें।',
      'पलंग धातु का न होकर प्राकृतिक लकड़ी का होना चाहिए। दोनों ओर चलने की जगह रखें।',
      'बिस्तर के ऊपर छत की बीम (शहतीर) नहीं होनी चाहिए, इससे मानसिक तनाव बढ़ता है।'
    ],
    colorsEn: 'Warm earthy tones, beige, almond, light brown, soft ivory. Avoid bright red and dark black.',
    colorsHi: 'हल्का बादामी, बेज, मटमैला या हल्का भूरा। लाल व काले रंग से बचें।',
    remediesEn: [
      'If bedroom is in North-East: Use yellow curtains and place a heavy brass bowl filled with whole yellow mustard seeds.',
      'If bedroom is in South-East: Paint walls light cream and avoid all red shades to calm agitation.',
      'If overhead beam is over bed: Conceal with a false ceiling or hang a pair of bamboo flutes tied with red thread.'
    ],
    remediesHi: [
      'यदि बेडरूम ईशान (NE) में हो: पीले पर्दे लगाएं और भारी पीतल के कटोरे में पीली सरसों रखें।',
      'यदि बेडरूम आग्नेय (SE) में हो: दीवारों पर क्रीम या हल्का सफेद रंग करें, लाल रंग से बचें।',
      'यदि छत पर बीम हो: फॉल्स सीलिंग कराएं या बीम पर लाल धागे से बंधी दो बांसुरी लटकाएं।'
    ]
  },
  {
    id: 'study_room',
    nameEn: 'Study Room & Desk',
    nameHi: 'अध्ययन कक्ष व स्टडी टेबल',
    icon: '📚',
    idealZones: ['WSW', 'NE', 'E', 'N'],
    acceptableZones: ['W', 'NW'],
    negativeZones: ['SE', 'SSW', 'ESE', 'SW', 'NNW'],
    bestFacingEn: 'Student must face East (Memory & Retention) or North (Focus & Calculation).',
    bestFacingHi: 'पढ़ते समय मुख पूर्व (उत्तम स्मरण शक्ति) या उत्तर (एकाग्रता व विश्लेषण) की ओर होना चाहिए।',
    keyRulesEn: [
      'West-South-West (WSW) is the MahaVastu "Vidya Pada" — studying here guarantees long-term retention and high exam ranks.',
      'North-East provides divine inspiration, deep concentration and clarity for competitive aspirants.',
      'Keep the study table clutter-free. Never let books pile up in a messy state.',
      'Keep a solid wall behind the student\'s back (gives subconscious security and mental stability).',
      'Avoid studying directly under an overhead beam or facing a blank dead wall without space.'
    ],
    keyRulesHi: [
      'पश्चिम-दक्षिण-पश्चिम (WSW) महावास्तु का विद्या पद है — यहाँ पढ़ाई करने से याददाश्त अद्भुत रहती है।',
      'ईशान कोण (NE) बौद्धिक क्षमता, एकाग्रता और प्रतियोगी परीक्षाओं में विजय दिलाता है।',
      'स्टडी टेबल पर अव्यवस्था न हो। अप्रयुक्त पुस्तकें हटाकर साफ-सुथरा रखें।',
      'पढ़ते समय पीठ के पीछे ठोस दीवार होनी चाहिए, इससे आत्मविश्वास बढ़ता है।',
      'दरवाजे की ओर पीठ करके न बैठें और टेबल दीवार से चिपका कर न रखें, थोड़ा खुला स्थान रखें।'
    ],
    colorsEn: 'Light green, pastel yellow, light cyan, off-white. Avoid red and dark blue.',
    colorsHi: 'हल्का हरा (बुध का रंग), हल्का पीला, हल्का आसमानी या सफेद।',
    remediesEn: [
      'Place a Saraswati Yantra or a crystal globe on the North-East corner of the study table.',
      'Rotate the crystal globe 3 times daily to energize mental creativity.',
      'Use a pyramid study lamp with warm white light on the left side of the desk.'
    ],
    remediesHi: [
      'स्टडी टेबल के ईशान कोण पर सरस्वती यंत्र या स्फटिक ग्लोब रखें।',
      'रोजाना सुबह ग्लोब को तीन बार घुमाएं, इससे बौद्धिक ऊर्जा जाग्रत होती है।',
      'टेबल की बाईं ओर पीली/सफेद रोशनी वाला लैंप रखें।'
    ]
  },
  {
    id: 'kitchen',
    nameEn: 'Kitchen (Agni)',
    nameHi: 'रसोईघर (अग्नि तत्व)',
    icon: '🍳',
    idealZones: ['SE', 'SSE', 'NW'],
    acceptableZones: ['W', 'S'],
    negativeZones: ['NE', 'N', 'SW', 'E'],
    bestFacingEn: 'Cook must face East while preparing food (brings vitality & prosperity).',
    bestFacingHi: 'खाना बनाते समय मुख हमेशा पूर्व दिशा की ओर होना चाहिए (दीर्घायु व स्वास्थ्य)।',
    keyRulesEn: [
      'South-East (Agneya) is the natural seat of Lord Agni. Kitchen here ensures continuous cash flow and vibrant health.',
      'Fire & Water Clash: Keep the gas stove and the water sink at least 3 feet apart. Fire and water must never collide.',
      'Never place the kitchen in the North-East (Ishanya) — causes severe financial distress and family illness.',
      'Never place the kitchen in the South-West — causes dominance clashes and health issues for the women of the house.',
      'Refrigerator should be in South or West; microwave/oven in South-East.'
    ],
    keyRulesHi: [
      'आग्नेय कोण (SE) अग्नि देव का वास है। यहाँ रसोई होने से घर में धन की आवक और स्वास्थ्य बना रहता है।',
      'अग्नि व जल का विरोध: गैस चूल्हा और सिंक (पानी का नल) कम से कम 3 फीट दूर होने चाहिए।',
      'ईशान कोण (NE) में रसोई महादोष है — इससे वंश वृद्धि में बाधा और अकारण धन हानि होती है।',
      'नैऋत्य (SW) में रसोई होने से घर की महिलाओं का स्वास्थ्य प्रभावित होता है।',
      'फ्रिज दक्षिण या पश्चिम में रखें; माइक्रोवेव/ओवन आग्नेय कोण में रखें।'
    ],
    colorsEn: 'Warm pastel tones, light beige, peach, soft orange, cream. Strictly avoid black granite, blue tiles, or dark green.',
    colorsHi: 'हल्का नारंगी, पीच, बादामी या क्रीम। काले ग्रेनाइट और नीले पत्थरों से बचें।',
    remediesEn: [
      'If stove and sink are adjacent: Place a small wooden divider or a live green plant between them to absorb elemental conflict.',
      'If kitchen is in North-East: Place a green Baroda marble slab under the gas burner to neutralize the fire in water zone.',
      'If kitchen is in North: Place a green marble plate under the stove to balance water-fire antagonism.'
    ],
    remediesHi: [
      'यदि चूल्हा व सिंक पास-पास हों: दोनों के बीच एक लकड़ी का टुकड़ा या छोटा हरा पौधा रखें।',
      'यदि रसोई ईशान (NE) में हो: गैस चूल्हे के नीचे हरे रंग का बड़ौदा मार्बल स्लैब रखें।',
      'रसोई में काले स्लैब के ऊपर गैस चूल्हा रखने से बचें; नीचे पीला या भूरा मार्बल लगाएं।'
    ]
  },
  {
    id: 'pooja_mandir',
    nameEn: 'Pooja Mandir',
    nameHi: 'पूजा घर / मंदिर',
    icon: '🪔',
    idealZones: ['NE', 'E', 'N'],
    acceptableZones: ['W'],
    negativeZones: ['S', 'SW', 'SE', 'SSW', 'NW'],
    bestFacingEn: 'Devotee should face East or North during prayer; Deities face West or South.',
    bestFacingHi: 'पूजा करते समय उपासक का मुख पूर्व या उत्तर दिशा में होना चाहिए।',
    keyRulesEn: [
      'North-East (Ishanya) is the supreme divine portal. Mandir here amplifies spiritual peace and draws abundant cosmic grace.',
      'Deity idols should be placed on a wooden pedestal at chest height, not directly on the floor.',
      'Never build a mandir under a staircase, inside a bedroom, or sharing a wall with a toilet.',
      'Keep the pooja altar illuminated with a brass ghee diya facing East or North.',
      'Do not keep broken (khandit) idols, pictures of deceased ancestors, or fierce weapons inside the mandir.'
    ],
    keyRulesHi: [
      'ईशान कोण (NE) ईश्वर का साक्षात द्वार है। यहाँ मंदिर होने से घर में शांति, समृद्धि व सकारात्मक ऊर्जा बरसती है।',
      'मूर्तियां लकड़ी की चौकी पर सीने की ऊंचाई पर होनी चाहिए, जमीन पर नहीं।',
      'सीढ़ियों के नीचे, बेडरूम में या शौचालय की दीवार से सटाकर मंदिर कभी न बनाएं।',
      'मंदिर में शुद्ध घी का दीया जलाएं, जिसकी लौ पूर्व या उत्तर की ओर हो।',
      'खंडित मूर्तियां, पूर्वजों (पितरों) की तस्वीरें या उग्र अस्त्र-शस्त्र मंदिर में न रखें।'
    ],
    colorsEn: 'Sacred white, light yellow, cream, light gold. Avoid dark black, grey, or dark brown.',
    colorsHi: 'श्वेत (सफेद), हल्का पीला, सुनहरा या क्रीम रंग।',
    remediesEn: [
      'If mandir is in wrong zone: Shift the primary brass deities to the North-East corner of the living room.',
      'Keep a copper vessel with fresh water in the North-East corner of the mandir daily, sprinkling it throughout the house in the morning.',
      'Light natural camphor every evening to purify negative vibrations.'
    ],
    remediesHi: [
      'यदि मंदिर गलत दिशा में हो: बैठक कक्ष के ईशान कोण में एक छोटा लकड़ी का मंदिर स्थापित करें।',
      'मंदिर के ईशान कोण में तांबे के लोटे में गंगाजल या शुद्ध जल रखें और सुबह घर में छिड़कें।',
      'रोजाना संध्या समय भीमसेनी कपूर जलाएं, इससे सभी वास्तु दोष शांत होते हैं।'
    ]
  },
  {
    id: 'locker_cash',
    nameEn: 'Locker & Wealth Vault',
    nameHi: 'तिजोरी व धन स्थान',
    icon: '💰',
    idealZones: ['N', 'W', 'SW'],
    acceptableZones: ['E'],
    negativeZones: ['SE', 'SSW', 'ESE', 'WNW'],
    bestFacingEn: 'Locker door must open towards the North (abode of Lord Kuber).',
    bestFacingHi: 'तिजोरी का द्वार हमेशा उत्तर दिशा की ओर खुलना चाहिए (कुबेर का वास)।',
    keyRulesEn: [
      'North is governed by Lord Kuber. Placing the safe in the South wall opening to North constantly multiplies financial wealth.',
      'Locker in South-West must be heavy, grounding wealth and preventing unwarranted expenditure.',
      'Never place a locker in the South-East — money will burn away like fire through unexpected expenses and hospital bills.',
      'Place a silver coin of Goddess Lakshmi & Lord Ganesha or a Kuber Yantra inside the cash vault.',
      'Keep the inside of the locker clean, lined with red or yellow velvet cloth.'
    ],
    keyRulesHi: [
      'उत्तर दिशा कुबेर देव का स्थान है। दक्षिण दीवार से सटाकर उत्तर की ओर खुलने वाली तिजोरी धनवर्धक होती है।',
      'नैऋत्य (SW) में भारी तिजोरी रखने से संचित धन सुरक्षित रहता है और फिजूलखर्ची रुकती है।',
      'आग्नेय (SE) में तिजोरी रखने से धन पानी की तरह बह जाता है और अनचाहे खर्चे आते हैं।',
      'तिजोरी में लाल या पीले कपड़े का बिछौना रखें और कुबेर यंत्र या चांदी का सिक्का रखें।',
      'तिजोरी के अंदर कभी भी कोर्ट-कचहरी के कागज या अप्रिय दस्तावेज न रखें।'
    ],
    colorsEn: 'Golden yellow, cream, silver white, soft red accents inside.',
    colorsHi: 'पीला, सुनहरा, क्रीम या हल्का लाल।',
    remediesEn: [
      'Place a small mirror on the inside door of the safe so it reflects the cash, symbolically doubling your wealth.',
      'Keep a green pouch with 5 cardamom pods and a silver coin inside the locker.',
      'Do not place empty boxes or unpaid debt bills inside the cash locker.'
    ],
    remediesHi: [
      'तिजोरी के भीतरी पल्ले पर एक छोटा दर्पण लगाएं जिससे खुलते समय नकदी का प्रतिबिंब दिखे (धन दोगुना होने का प्रतीक)।',
      'तिजोरी में 5 हरी इलायची और 11 कौड़ियां पीले कपड़े में बांधकर रखें।',
      'तिजोरी के ऊपर कोई भारी कबाड़ या कचरा न रखें।'
    ]
  },
  {
    id: 'toilet',
    nameEn: 'Toilet & Bathroom',
    nameHi: 'शौचालय व स्नानघर',
    icon: '🚿',
    idealZones: ['SSW', 'WNW', 'ESE'],
    acceptableZones: ['NW', 'W'],
    negativeZones: ['NE', 'SW', 'SE', 'N'],
    bestFacingEn: 'Commode user should face North or South while seated.',
    bestFacingHi: 'शौचालय की सीट पर बैठते समय मुख उत्तर या दक्षिण की ओर होना चाहिए।',
    keyRulesEn: [
      'South-South-West (SSW) is the ideal MahaVastu zone of disposal — toilets here flush out impurities without harming family fortune.',
      'FATAL FLAW: Toilet in North-East (Ishanya) causes severe neurological issues, paralysis, mental breakdown, and blocks prosperity.',
      'Toilet in South-West (Nairutya) shatters marital stability, business partnerships, and ancestral lineage.',
      'Toilet in North drains all money making opportunities; toilet in South-East drains cash flow.',
      'Always keep the toilet lid closed when not in use to prevent negative energy from circulating into the house.'
    ],
    keyRulesHi: [
      'दक्षिण-दक्षिण-पश्चिम (SSW) विसर्जन का क्षेत्र है — यहाँ शौचालय होने से घर की नकारात्मकता बाहर निकलती है।',
      'महादोष: ईशान कोण (NE) में शौचालय कैंसर, पक्षाघात (लकवा), मानसिक अवसाद और वंश हानि का कारण बनता है।',
      'नैऋत्य (SW) में शौचालय दांपत्य जीवन और व्यापारिक साझेदारियों को नष्ट कर देता है।',
      'उत्तर में शौचालय धन के अवसर छीन लेता है; आग्नेय (SE) में नकदी समाप्त कर देता है।',
      'उपयोग के बाद कमोड की लिड (ढक्कन) हमेशा बंद रखें ताकि नकारात्मक ऊर्जा घर में न फैले।'
    ],
    colorsEn: 'Off-white, soft cream, light grey. Avoid bright yellow in NE or red in water zones.',
    colorsHi: 'हल्का स्लेटी, क्रीम या सफेद रंग।',
    remediesEn: [
      'NON-DEMOLITION REMEDY: Seal the toilet boundary on the floor using a 3-inch wide metal tape (Copper tape for SE, Brass tape for SW/SSW, Iron tape for W, Aluminium/Blue tape for N/NE).',
      'Keep a small glass bowl filled with unprocessed Himalayan rock salt in the toilet, replacing it every 15 days.',
      'Hang a bronze Swastika or mirror outside the toilet door to reflect negative energy away.'
    ],
    remediesHi: [
      'बिना तोड़फोड़ का उपाय: कमोड की चौखट के चारों ओर फर्श पर 3-इंच चौड़ी धातु की पट्टी/टेप लगाएं (SE में तांबा, SW/SSW में पीतल, W में लोहा, N में एल्युमिनियम)।',
      'शौचालय में कांच की कटोरी में साबुत समुद्री नमक (सेंधा नमक) रखें और हर 15 दिन में बदलें।',
      'शौचालय के दरवाजे के बाहर एक छोटा दर्पण या पीतल का स्वस्तिक लगाएं।'
    ]
  },
  {
    id: 'living_room',
    nameEn: 'Living & Drawing Room',
    nameHi: 'बैठक कक्ष (लिविंग रूम)',
    icon: '🛋️',
    idealZones: ['E', 'N', 'NE', 'NW'],
    acceptableZones: ['W'],
    negativeZones: ['SW', 'SSW'],
    bestFacingEn: 'Family head should sit facing North or East while interacting with guests.',
    bestFacingHi: 'अतिथियों से बात करते समय गृहस्वामी का मुख उत्तर या पूर्व की ओर होना चाहिए।',
    keyRulesEn: [
      'East or North living room welcomes healthy social connections, warmth, and fresh morning prana.',
      'Heavy sofas should be placed along the South and West walls, leaving the North and East open and light.',
      'Television and entertainment units should ideally be placed in the South-East or East.',
      'Keep the center of the living room (Brahmasthan) completely vacant and unburdened.',
      'Hang paintings of rising sun, running white horses, or lush green landscapes on the North/East walls.'
    ],
    keyRulesHi: [
      'पूर्व या उत्तर में बैठक कक्ष परिवार के सामाजिक संबंधों को प्रगाढ़ बनाता है।',
      'भारी सोफे दक्षिण और पश्चिम की दीवार के सहारे रखें, उत्तर और पूर्व को हल्का रखें।',
      'टेलीविजन और इलेक्ट्रॉनिक उपकरण आग्नेय कोण (SE) या पूर्व की दीवार पर लगाएं।',
      'लिविंग रूम के केंद्र (ब्रह्मस्थान) को हमेशा खाली और हल्का रखें।',
      'उत्तर/पूर्व की दीवार पर उगते सूर्य या 7 दौड़ते सफेद घोड़ों की तस्वीर लगाएं।'
    ],
    colorsEn: 'Warm white, cream, light emerald, pale gold. Avoid excessively dark or somber colors.',
    colorsHi: 'क्रीम, हल्का हरा, हल्का सुनहरा या श्वेत।',
    remediesEn: [
      'Keep an aquarium with 9 goldfish and 1 black moor fish in the North or East of the living room.',
      'Ensure the entrance door opens inward smoothly without creaking sounds.',
      'Diffuse natural sandalwood or lemon essential oil in the living room every morning.'
    ],
    remediesHi: [
      'लिविंग रूम के उत्तर या पूर्व में जल पात्र में ताजे फूल रखें।',
      'प्रवेश द्वार खोलते समय आवाज नहीं आनी चाहिए; कब्जों में तेल लगाएं।',
      'प्रतिदिन सुबह चंदन या लोबान की सुगंधित धूप करें।'
    ]
  },
  {
    id: 'water_tanks',
    nameEn: 'Water Tanks (Underground & Overhead)',
    nameHi: 'जल भंडारण (भूमिगत व ओवरहेड)',
    icon: '💧',
    idealZones: ['Underground: N, NE', 'Overhead: SW, W'],
    acceptableZones: ['Underground: E', 'Overhead: S'],
    negativeZones: ['Underground in SW/SE', 'Overhead in NE/Brahmasthan'],
    bestFacingEn: 'Underground in North-East (Purity); Overhead in South-West (Heavy Stability).',
    bestFacingHi: 'भूमिगत टैंक ईशान/उत्तर में (पवित्रता); ओवरहेड भारी टैंक नैऋत्य/पश्चिम में (स्थायित्व)।',
    keyRulesEn: [
      'Underground Water Tank / Borewell must STRICTLY be in North, North-East, or East. Water belongs to the Water element.',
      'FATAL FLAW: Underground tank in South-West causes untimely death, grave financial loss, and destroys family stability.',
      'FATAL FLAW: Underground tank in South-East creates fire-water warfare, leading to heavy debts, lawsuits, and hospitalizations.',
      'Overhead Heavy Water Tank must STRICTLY be in South-West, West, or South to provide grounding weight.',
      'Never place an overhead tank on the North-East roof (it crushes the cosmic head of the Vastu Purusha).'
    ],
    keyRulesHi: [
      'भूमिगत पानी का टैंक व बोरवेल केवल उत्तर, ईशान (NE) या पूर्व में ही होना चाहिए।',
      'महादोष: नैऋत्य (SW) में भूमिगत गड्ढा या बोरवेल अकाल मृत्यु, दिवालियापन और वंश नाश का कारण बनता है।',
      'महादोष: आग्नेय (SE) में भूमिगत जल टैंक होने से कर्ज, मुकदमेबाजी और भारी आर्थिक नुकसान होता है।',
      'छत पर ओवरहेड भारी टंकी हमेशा नैऋत्य (SW) या पश्चिम में होनी चाहिए।',
      'ईशान कोण (NE) की छत पर कभी भी भारी पानी की टंकी न रखें (यह वास्तु पुरुष का मस्तक दबाती है)।'
    ],
    colorsEn: 'Black/Dark for overhead tanks in SW; Light blue/white for underground in NE.',
    colorsHi: 'ओवरहेड टैंक के लिए काला/गहरा; भूमिगत के लिए नीला/सफेद।',
    remediesEn: [
      'If overhead tank is in North-East: Shift it immediately to South-West. If impossible, place a red bulb underneath and brass pyramid plate.',
      'If borewell is in South-East: Dig a new pit in North-East and treat the SE pit with a copper strip and earth energy neutralizers.',
      'Keep water storage tanks covered, leak-free, and thoroughly sanitized.'
    ],
    remediesHi: [
      'यदि ओवरहेड टंकी ईशान में हो: उसे तुरंत नैऋत्य में स्थानांतरित करें; अस्थायी तौर पर नीचे पीतल की प्लेट लगाएं।',
      'पानी के नलों से कभी भी पानी नहीं टपकना चाहिए, इससे धन की बर्बादी होती है।',
      'टंकी की नियमित सफाई रखें और कभी खुला न छोड़ें।'
    ]
  }
];

export const VASTU_DAILY_RULES = {
  sleeping: {
    titleEn: 'Scientific Sleeping Direction Rules',
    titleHi: 'सोने की दिशा के वैज्ञानिक नियम',
    items: [
      {
        directionEn: 'South (Recommended)',
        directionHi: 'दक्षिण (सर्वोत्तम)',
        status: 'excellent',
        descEn: 'Human body has magnetic polarity (Head is North pole). Sleeping with head to South attracts positive polarity from Earth\'s South pole, ensuring stable blood pressure, deep sleep, and cellular regeneration.',
        descHi: 'मानव शरीर का सिर उत्तरी ध्रुव होता है। दक्षिण सिर करने से पृथ्वी के चुंबकीय क्षेत्र से उत्तम संतुलन बनता है, जिससे रक्तचाप नियंत्रित और नींद गहरी होती है।'
      },
      {
        directionEn: 'East (Ideal for Students)',
        directionHi: 'पूर्व (छात्रों के लिए उत्तम)',
        status: 'good',
        descEn: 'Aligns head with sunrise energy. Enhances memory, spiritual clarity, cognitive agility, and academic excellence.',
        descHi: 'ज्ञान और ध्यान के लिए सर्वोत्तम। छात्रों और शोधकर्ताओं को पूर्व सिर करके सोना चाहिए, इससे बुद्धि तीव्र होती है।'
      },
      {
        directionEn: 'West (Acceptable)',
        directionHi: 'पश्चिम (सामान्य)',
        status: 'neutral',
        descEn: 'Acceptable for business professionals, though may cause occasional vivid dreaming.',
        descHi: 'व्यापारियों और वयस्कों के लिए स्वीकार्य है, किंतु दक्षिण जितना प्रभावशाली नहीं है।'
      },
      {
        directionEn: 'North (STRICTLY FORBIDDEN)',
        directionHi: 'उत्तर (कदापि न सोएं - वर्जित)',
        status: 'negative',
        descEn: 'Magnetic repulsion! North pole of body repels North pole of Earth, causing disturbed sleep, severe migraines, high blood pressure, and long-term cardiovascular stress.',
        descHi: 'चुंबकीय विरोध! उत्तर सिर करने से रक्त का दबाव मस्तिष्क की ओर बढ़ता है, जिससे अनिद्रा, बुरे सपने, सिरदर्द और हृदय रोग होते हैं।'
      }
    ]
  },
  eating: {
    titleEn: 'Dining & Food Consumption Rules',
    titleHi: 'भोजन करने के शुभ नियम',
    items: [
      {
        directionEn: 'Face East while eating',
        directionHi: 'पूर्व मुखी भोजन',
        descEn: 'Promotes optimal digestive fire (Jatharagni), longevity, and vital health.',
        descHi: 'जठराग्नि को प्रदीप्त करता है, आयु बढ़ाता है और स्वास्थ्य उत्तम रखता है।'
      },
      {
        directionEn: 'Face North while eating',
        directionHi: 'उत्तर मुखी भोजन',
        descEn: 'Attracts prosperity and wealth; suitable for business owners.',
        descHi: 'धन और संपन्नता की वृद्धि करता है।'
      },
      {
        directionEn: 'Never face South while eating',
        directionHi: 'दक्षिण मुखी भोजन न करें',
        descEn: 'Invites digestive disorders, sluggish metabolism, and negative energy.',
        descHi: 'पाचन क्रिया कमजोर होती है और नकारात्मक विचार आते हैं।'
      }
    ]
  }
};
