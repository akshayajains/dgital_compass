import { Language } from '@/types/compass';

/**
 * Feng Shui curing suggestions for each Bagua area.
 * Each area maps to a life aspect and has specific cures
 * based on traditional Feng Shui principles.
 */

export interface FengShuiCure {
  type: 'element' | 'color' | 'object' | 'plant' | 'crystal' | 'mirror' | 'water' | 'light' | 'sound';
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  priority: 'high' | 'medium' | 'low';
}

export interface BaguaArea {
  id: string;
  direction: string;
  directionHi: string;
  lifeAspect: { en: string; hi: string };
  element: string;
  elementHi: string;
  color: string;
  cures: FengShuiCure[];
  enhancements: string[];
  warnings: string[];
}

export const BAGUA_AREAS: Record<string, BaguaArea> = {
  wealth: {
    id: 'wealth',
    direction: 'South-East',
    directionHi: 'दक्षिण-पूर्व',
    lifeAspect: { en: 'Wealth & Abundance', hi: 'धन एवं समृद्धि' },
    element: 'Wood',
    elementHi: 'वनस्पति तत्व',
    color: 'Green',
    cures: [
      {
        type: 'plant',
        title: { en: 'Money Plant', hi: 'धन पौधा' },
        description: { en: 'Place a healthy money plant (Jade plant) in the SE corner to activate wealth energy. Keep it well-watered and thriving.', hi: 'धन ऊर्जा सक्रिय करने के लिए SE कोने में स्वस्थ धन पौधा रखें। इसे अच्छी तरह पानी दें।' },
        priority: 'high'
      },
      {
        type: 'water',
        title: { en: 'Water Feature', hi: 'जल विशेष' },
        description: { en: 'A small fountain or bowl of water nourishes the Wood element in the Wealth area. Water feeds Wood in the productive cycle.', hi: 'एक छोटा फव्वारा या पानी की कटोरा धन क्षेत्र में वुड तत्व को पोषित करता है।' },
        priority: 'high'
      },
      {
        type: 'crystal',
        title: { en: 'Citrine Crystal', hi: 'सिटरीन क्रिस्टल' },
        description: { en: 'Place a Citrine crystal cluster or Pyrite (Fool\'s Gold) to attract financial opportunities and abundance.', hi: 'वित्तीय अवसर आकर्षित करने के लिए सिटरीन क्रिस्टल या पाइराइट रखें।' },
        priority: 'medium'
      },
      {
        type: 'color',
        title: { en: 'Green & Purple Decor', hi: 'हरा और बैंगनी सजावट' },
        description: { en: 'Use green (Wood) and purple (Wealth) colors in cushions, artwork, or rugs in this area.', hi: 'इस क्षेत्र में बालिश, कला या कार्पेट में हरा और बैंगनी रंग उपयोग करें।' },
        priority: 'low'
      },
      {
        type: 'object',
        title: { en: 'Wealth Symbols', hi: 'धन प्रतीक' },
        description: { en: 'Display coins, ingots, or images of abundance. A wealth bowl filled with coins and crystals works well.', hi: 'सिक्के, नगद या समृद्धि की तस्वीरें प्रदर्शित करें। सिक्कों और क्रिस्टल से भरा धन कटोरा अच्छा काम करता है।' },
        priority: 'medium'
      }
    ],
    enhancements: ['Healthy plants', 'Water features', 'Purple accents', 'Coin displays'],
    warnings: ['Avoid fire elements (candles, stoves) — Wood feeds Fire, draining Wealth energy', 'No bathrooms or clutter in this sector']
  },
  love: {
    id: 'love',
    direction: 'South-West',
    directionHi: 'दक्षिण-पश्चिम',
    lifeAspect: { en: 'Love & Relationships', hi: 'प्रेम एवं संबंध' },
    element: 'Earth',
    elementHi: 'पृथ्वी तत्व',
    color: 'Pink',
    cures: [
      {
        type: 'object',
        title: { en: 'Pair of Objects', hi: 'जोड़े की वस्तुएँ' },
        description: { en: 'Place items in pairs (candles, vases, dolls) to symbolize partnership and harmony in relationships.', hi: 'संबंधों में साझेदारी और सामंजस्य का प्रतीक बनाने के लिए वस्तुओं को जोड़ों में रखें।' },
        priority: 'high'
      },
      {
        type: 'color',
        title: { en: 'Pink & Earth Tones', hi: 'गुलाबी और मिट्टी के रंग' },
        description: { en: 'Decorate with pink, beige, or terracotta colors to strengthen the Earth element of love.', hi: 'प्रेम के मिट्टी तत्व को मजबूत करने के लिए गुलाबी, बीज या टेराकोटा रंगों से सजayeं।' },
        priority: 'medium'
      },
      {
        type: 'crystal',
        title: { en: 'Rose Quartz', hi: 'रोज़ क्वाartz' },
        description: { en: 'A Rose Quartz heart or cluster promotes unconditional love, compassion, and emotional healing.', hi: 'रोज़ क्वाartz का दिल या क्लस्टर अशर्त प्रेम, करुणा और भावनात्मक उपचार को बढ़ावा देता है।' },
        priority: 'high'
      },
      {
        type: 'object',
        title: { en: 'Couple Photos', hi: 'जोड़े की तस्वीरें' },
        description: { en: 'Display happy photos of you and your partner, or a wedding photo, in this sector.', hi: 'इस क्षेत्र में अपने और अपने साथी की खुश तस्वीरें या शादी की तस्वीर रखें।' },
        priority: 'medium'
      },
      {
        type: 'plant',
        title: { en: 'Avoid Overwatering', hi: 'अतिरिक्त पानी से बचें' },
        description: { en: 'Too much water in the SW drains the Earth element. If using plants, choose drought-resistant succulents.', hi: 'SW में बहुत अधिक पानी मिट्टी तत्व को कमजोर करता है। पौधे रखें तो सूखे सहनशील चुनें।' },
        priority: 'high'
      }
    ],
    enhancements: ['Paired objects', 'Rose quartz', 'Warm earth tones', 'Couple imagery'],
    warnings: ['Avoid single items — they symbolize loneliness', 'No mirrors facing the bed in the bedroom SW corner']
  },
  career: {
    id: 'career',
    direction: 'North',
    directionHi: 'उत्तर',
    lifeAspect: { en: 'Career & Life Path', hi: 'करियर एवं जीवन मार्ग' },
    element: 'Water',
    elementHi: 'जल तत्व',
    color: 'Blue',
    cures: [
      {
        type: 'water',
        title: { en: 'Flowing Water', hi: 'बहता पानी' },
        description: { en: 'A small indoor fountain with water flowing toward the center of the home activates career momentum.', hi: 'घर के केंद्र की ओर बहते पानी के साथ छोटा फव्वारा करियर गति को सक्रिय करता है।' },
        priority: 'high'
      },
      {
        type: 'color',
        title: { en: 'Black & Blue', hi: 'काला और नीला' },
        description: { en: 'Use black and deep blue colors in this area to strengthen the Water element of career.', hi: 'करियर के जल तत्व को मजबूत करने के लिए इस क्षेत्र में काला और गहरा नीला रंग उपयोग करें।' },
        priority: 'medium'
      },
      {
        type: 'object',
        title: { en: 'Career Achievements', hi: 'करियर उपलब्धियाँ' },
        description: { en: 'Display certificates, awards, or symbols of your professional goals in the North sector.', hi: 'उत्तर क्षेत्र में प्रमाणपत्र, पुरस्कार या पेशेवर लक्ष्यों के प्रतीक प्रदर्शित करें।' },
        priority: 'medium'
      },
      {
        type: 'crystal',
        title: { en: 'Black Tourmaline', hi: 'ब्लैक टूरमालाइन' },
        description: { en: 'Black Tourmaline or Obsidian protects against workplace negativity and supports career stability.', hi: 'ब्लैक टूरमालाइन या ऑब्सीडियन कार्यस्थल की नकारात्मकता से बचाता है और करियर स्थिरता का समर्थन करता है।' },
        priority: 'low'
      },
      {
        type: 'light',
        title: { en: 'Soft Lighting', hi: 'मृदु प्रकाश' },
        description: { en: 'Keep this area well-lit but with soft, calming light — avoid harsh overhead lighting.', hi: 'इस क्षेत्र को अच्छी तरह रोशन रखें लेकिन मृदु, शांत प्रकाश के साथ — कठोर प्रकाश से बचें।' },
        priority: 'low'
      }
    ],
    enhancements: ['Water features', 'Blue/black decor', 'Career symbols', 'Mission statement'],
    warnings: ['Avoid excessive fire (red candles, stoves) — Fire boils away Water', 'Keep the area clean and uncluttered for clear career path']
  },
  family: {
    id: 'family',
    direction: 'East',
    directionHi: 'पूर्व',
    lifeAspect: { en: 'Family & Health', hi: 'परिवार एवं स्वास्थ्य' },
    element: 'Wood',
    elementHi: 'वनस्पति तत्व',
    color: 'Green',
    cures: [
      {
        type: 'plant',
        title: { en: 'Tall Healthy Plants', hi: 'लंबे स्वस्थ पौधे' },
        description: { en: 'Place tall, upright plants (Bamboo, Ficus) in the East to strengthen family bonds and health energy.', hi: 'परिवार बंधन और स्वास्थ्य ऊर्जा को मजबूत करने के लिए पूर्व में लंबे पौधे रखें।' },
        priority: 'high'
      },
      {
        type: 'object',
        title: { en: 'Family Photos', hi: 'परिवार की तस्वीरें' },
        description: { en: 'Display a family tree chart or group photo in the East sector to honor ancestral connections.', hi: 'पूर्व क्षेत्र में परिवार का चार्ट या समूह तस्वीर रखें ताकि पूर्वजों के संबंधों का सम्मान हो।' },
        priority: 'high'
      },
      {
        type: 'color',
        title: { en: 'Green & Blue Accents', hi: 'हरा और नीला रंग' },
        description: { en: 'Use green (Wood) and blue (Water feeds Wood) colors in this area for family harmony.', hi: 'परिवार सामंजस्य के लिए इस क्षेत्र में हरा और नीला रंग उपयोग करें।' },
        priority: 'medium'
      },
      {
        type: 'sound',
        title: { en: 'Wooden Wind Chimes', hi: 'लकड़ी की हवा की घंटियाँ' },
        description: { en: 'Hang wooden wind chimes in the East to circulate positive Wood energy for family health.', hi: 'परिवार स्वास्थ्य के लिए पूर्व में सकारात्मक वुड ऊर्जा को घुमाने के लिए लकड़ी की घंटियाँ लटकाएं।' },
        priority: 'low'
      },
      {
        type: 'crystal',
        title: { en: 'Green Aventurine', hi: 'ग्रीन एवेंचुराइन' },
        description: { en: 'Green Aventurine promotes heart opening, family harmony, and overall well-being.', hi: 'ग्रीन एवेंचुराइन हृदय खोलना, परिवार सामंजस्य और समग्र कल्याण को बढ़ावा देता है।' },
        priority: 'medium'
      }
    ],
    enhancements: ['Living plants', 'Family tree', 'Green decor', 'Wooden furniture'],
    warnings: ['Avoid metal objects — Metal chops Wood, weakening family energy', 'No broken or dying plants in this sector']
  },
  fame: {
    id: 'fame',
    direction: 'South',
    directionHi: 'दक्षिण',
    lifeAspect: { en: 'Fame & Reputation', hi: 'प्रसिद्धि एवं प्रतिष्ठा' },
    element: 'Fire',
    elementHi: 'अग्नि तत्व',
    color: 'Red',
    cures: [
      {
        type: 'light',
        title: { en: 'Bright Lighting', hi: 'चमकदार प्रकाश' },
        description: { en: 'Install the brightest light in your home in the South sector to activate fame and recognition energy.', hi: 'प्रसिद्धि और पहचान ऊर्जा को सक्रिय करने के लिए दक्षिण क्षेत्र में अपने घर का सबसे चमकदार प्रकाश लगाएं।' },
        priority: 'high'
      },
      {
        type: 'object',
        title: { en: 'Achievement Display', hi: 'उपलब्धि प्रदर्शन' },
        description: { en: 'Showcase awards, certificates, or creative works that represent your highest achievements.', hi: 'पुरस्कार, प्रमाणपत्र या रचनात्मक कार्य प्रदर्शित करें जो आपकी सर्वोच्च उपलब्धियों का प्रतिनिधित्व करते हैं।' },
        priority: 'medium'
      },
      {
        type: 'color',
        title: { en: 'Red Accents', hi: 'लाल रंग' },
        description: { en: 'Use red in artwork, cushions, or a rug to strengthen the Fire element of fame.', hi: 'प्रसिद्धि के अग्नि तत्व को मजबूत करने के लिए कला, बालिश या कार्पेट में लाल रंग उपयोग करें।' },
        priority: 'medium'
      },
      {
        type: 'object',
        title: { en: 'Hexagonal Shapes', hi: 'षट्कोणीय आकार' },
        description: { en: 'Display hexagonal-shaped objects or artwork — the Fire element shape in Feng Shui.', hi: 'षट्कोणीय आकार की वस्तुएँ या कला प्रदर्शित करें — फेंग शूई में अग्नि तत्व का आकार।' },
        priority: 'low'
      },
      {
        type: 'plant',
        title: { en: 'Flowering Plants', hi: 'फूल वाले पौधे' },
        description: { en: 'Bright red or orange flowers in the South boost visibility and positive public image.', hi: 'दक्षिण में चमकदार लाल या नारंगी फूल दृश्यता और सकारात्मक सार्वजनिक छवि बढ़ाते हैं।' },
        priority: 'low'
      }
    ],
    enhancements: ['Bright lights', 'Red decor', 'Awards display', 'Flowers'],
    warnings: ['Avoid water features — Water extinguishes Fire, dimming your reputation', 'Keep the area active and well-maintained']
  },
  children: {
    id: 'children',
    direction: 'North-West',
    directionHi: 'उत्तर-पश्चिम',
    lifeAspect: { en: 'Children & Creativity', hi: 'बच्चे एवं रचनात्मकता' },
    element: 'Metal',
    elementHi: 'लोह तत्व',
    color: 'White',
    cures: [
      {
        type: 'object',
        title: { en: 'Children\'s Artwork', hi: 'बच्चों की कला' },
        description: { en: 'Display your children\'s drawings, crafts, or achievements in the NW to nurture creativity and growth.', hi: 'रचनात्मकता और विकास को पोषित करने के लिए NW में अपने बच्चों की चित्रकारी या उपलब्धियाँ प्रदर्शित करें।' },
        priority: 'high'
      },
      {
        type: 'color',
        title: { en: 'White & Metallic', hi: 'सफेद और धातु' },
        description: { en: 'Use white, gray, or metallic colors to strengthen the Metal element of creativity and children.', hi: 'रचनात्मकता और बच्चों के धातु तत्व को मजबूत करने के लिए सफेद, ग्रे या धातु रंग उपयोग करें।' },
        priority: 'medium'
      },
      {
        type: 'sound',
        title: { en: 'Metal Wind Chimes', hi: 'धातु की हवा की घंटियाँ' },
        description: { en: 'Hang metal wind chimes in the NW to circulate positive Metal energy for creativity and helpful people.', hi: 'रचनात्मकता और सहायक लोगों के लिए NW में सकारात्मक धातु ऊर्जा को घुमाने के लिए धातु की घंटियाँ लटकाएं।' },
        priority: 'medium'
      },
      {
        type: 'crystal',
        title: { en: 'Clear Quartz', hi: 'क्लियर क्वाartz' },
        description: { en: 'Clear Quartz amplifies intention and supports children\'s mental clarity and creative thinking.', hi: 'क्लियर क्वाartz इरादे को बढ़ाता है और बच्चों की मानसिक स्पष्टता और रचनात्मक सोच का समर्थन करता है।' },
        priority: 'low'
      },
      {
        type: 'object',
        title: { en: 'Round Metal Objects', hi: 'गोल धातु वस्तुएँ' },
        description: { en: 'Place round or spherical metal objects (bowls, bells) to enhance the Metal element energy.', hi: 'धातु तत्व ऊर्जा बढ़ाने के लिए गोल धातु वस्तुएँ रखें।' },
        priority: 'low'
      }
    ],
    enhancements: ['Metal decor', 'Children\'s art', 'White accents', 'Wind chimes'],
    warnings: ['Avoid excessive fire — Fire melts Metal, harming creativity', 'Keep this area clean and organized']
  },
  knowledge: {
    id: 'knowledge',
    direction: 'North-East',
    directionHi: 'उत्तर-पूर्व',
    lifeAspect: { en: 'Knowledge & Wisdom', hi: 'ज्ञान एवं बुद्धिमत्ता' },
    element: 'Earth',
    elementHi: 'पृथ्वी तत्व',
    color: 'Yellow',
    cures: [
      {
        type: 'crystal',
        title: { en: 'Crystal Cluster', hi: 'क्रिस्टल क्लस्टर' },
        description: { en: 'Place a large crystal cluster (Amethyst or Clear Quartz) in the NE to enhance wisdom and spiritual growth.', hi: 'ज्ञान और आध्यात्मिक विकास बढ़ाने के लिए NE में बड़ा क्रिस्टल क्लस्टर रखें।' },
        priority: 'high'
      },
      {
        type: 'object',
        title: { en: 'Books & Study Area', hi: 'किताबें और अध्ययन क्षेत्र' },
        description: { en: 'Set up a small library or study desk in the NE corner. Books, especially spiritual or educational texts, strengthen this area.', hi: 'NE कोने में छोटा पुस्तकालय या अध्ययन डेस्क लगाएं। किताबें, विशेष रूप से आध्यात्मिक या शैक्षिक पाठ, इस क्षेत्र को मजबूत करते हैं।' },
        priority: 'high'
      },
      {
        type: 'color',
        title: { en: 'Earth Tones', hi: 'मिट्टी के रंग' },
        description: { en: 'Use yellow, brown, or terracotta colors to strengthen the Earth element of knowledge.', hi: 'ज्ञान के मिट्टी तत्व को मजबूत करने के लिए पीला, भूरा या टेराकोटा रंग उपयोग करें।' },
        priority: 'medium'
      },
      {
        type: 'object',
        title: { en: 'Meditation Corner', hi: 'ध्यान कोना' },
        description: { en: 'Create a quiet meditation space with cushions, a small altar, or singing bowl in the NE sector.', hi: 'NE क्षेत्र में बालिश, छोटा मंदिर या गायन कटोरे के साथ शांत ध्यान स्थान बनाएं।' },
        priority: 'medium'
      },
      {
        type: 'light',
        title: { en: 'Warm Soft Light', hi: 'गर्म मृदु प्रकाश' },
        description: { en: 'Use warm, soft lighting for reading and contemplation — avoid harsh fluorescent lights.', hi: 'पढ़ाई और चिंतन के लिए गर्म, मृदु प्रकाश उपयोग करें — कठोर प्रकाश से बचें।' },
        priority: 'low'
      }
    ],
    enhancements: ['Crystal clusters', 'Books', 'Meditation space', 'Earth tones'],
    warnings: ['Avoid heavy clutter — it blocks wisdom energy', 'No TVs or electronic devices dominating this space']
  },
  helpers: {
    id: 'helpers',
    direction: 'West',
    directionHi: 'पश्चिम',
    lifeAspect: { en: 'Helpers & Travel', hi: 'सहायक एवं यात्रा' },
    element: 'Metal',
    elementHi: 'लोह तत्व',
    color: 'White',
    cures: [
      {
        type: 'object',
        title: { en: 'Gratitude Board', hi: 'कृतज्ञता बोर्ड' },
        description: { en: 'Keep a gratitude journal or board listing people who have helped you. This attracts more helpful people.', hi: 'उन लोगों की सूची वाला कृतज्ञता जर्नल रखें जो आपकी मदद करते हैं। इससे अधिक सहायक लोग आकर्षित होते हैं।' },
        priority: 'high'
      },
      {
        type: 'color',
        title: { en: 'White & Gold', hi: 'सफेद और सोना' },
        description: { en: 'Decorate with white, gold, or silver tones to strengthen the Metal element of helpers.', hi: 'सहायकों के धातु तत्व को मजबूत करने के लिए सफेद, सोना या चांदी के रंगों से सजाएं।' },
        priority: 'medium'
      },
      {
        type: 'object',
        title: { en: 'Travel Mementos', hi: 'यात्रा की यादें' },
        description: { en: 'Display souvenirs, maps, or photos from travels to activate the travel aspect of this sector.', hi: 'यात्रा के पहलू को सक्रिय करने के लिए यादगार, नक्शे या यात्रा की तस्वीरें प्रदर्शित करें।' },
        priority: 'medium'
      },
      {
        type: 'crystal',
        title: { en: 'Sodalite', hi: 'सोडलाइट' },
        description: { en: 'Sodalite or Howlite promotes clear communication and attracts mentors and helpful connections.', hi: 'सोडलाइट या हाउलाइट स्पष्ट संचार को बढ़ावा देता है और मार्गदर्शकों और सहायक संबंधों को आकर्षित करता है।' },
        priority: 'low'
      },
      {
        type: 'sound',
        title: { en: 'Singing Bowl', hi: 'गायन कटोरा' },
        description: { en: 'Ring a singing bowl in the West occasionally to clear stagnant energy and invite new connections.', hi: 'नई ऊर्जा और नए संबंधों को आमंत्रित करने के लिए पश्चिम में कभी-कभी गायन कटोरा बजाएं।' },
        priority: 'low'
      }
    ],
    enhancements: ['Metal objects', 'Gratitude practice', 'Travel items', 'White decor'],
    warnings: ['Avoid red/fire elements — Fire melts Metal, harming helpful connections', 'Keep photos of people you want in your life']
  }
};

/**
 * Get curing suggestions for a specific Bagua area based on the door direction.
 * The door direction shifts which physical area of the home maps to which Bagua zone.
 */
export function getFengShuiCures(
  baguaId: string,
  doorDirection: number,
  language: Language
): FengShuiCure[] {
  const area = BAGUA_AREAS[baguaId];
  if (!area) return [];

  // Sort by priority: high > medium > low
  return [...area.cures].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get all Bagua areas with their positions rotated based on door direction.
 */
export function getRotatedBaguaAreas(doorDirection: number) {
  const baguaOrder = ['knowledge', 'family', 'wealth', 'helpful', 'fame', 'love', 'helpers', 'career', 'children'];
  const rotation = Math.round(doorDirection / 45) % 8;

  // Rotate the Bagua map based on door direction
  const rotated = [...baguaOrder];
  for (let i = 0; i < rotation; i++) {
    const last = rotated.pop();
    if (last) rotated.unshift(last);
  }

  return rotated.map((id, index) => ({
    ...BAGUA_AREAS[id],
    gridPosition: index
  }));
}

/**
 * Generate a quick diagnostic for a Bagua area based on common issues.
 */
export function diagnoseBaguaArea(baguaId: string, hasBathroom: boolean, hasWindow: boolean, isCluttered: boolean): string[] {
  const issues: string[] = [];
  const area = BAGUA_AREAS[baguaId];
  if (!area) return issues;

  if (hasBathroom) {
    issues.push(`⚠️ ${area.lifeAspect.en}: A bathroom in this sector drains ${area.element} energy. Use a salt water cure — place a bowl of salt water here and replace it weekly.`);
  }

  if (isCluttered) {
    issues.push(`⚠️ ${area.lifeAspect.en}: Clutter blocks the flow of ${area.lifeAspect.en.toLowerCase()} energy. Clear and organize this space immediately.`);
  }

  if (!hasWindow) {
    issues.push(`💡 ${area.lifeAspect.en}: No window in this sector means stagnant energy. Add a mirror to reflect light and energy, or use bright lighting.`);
  }

  if (!hasBathroom && !isCluttered && hasWindow) {
    issues.push(`✅ ${area.lifeAspect.en}: This sector is well-positioned. Focus on enhancing it with the suggested cures above.`);
  }

  return issues;
}
