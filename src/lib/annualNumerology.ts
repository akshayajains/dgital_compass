import { Language } from '@/types/compass';

/**
 * Annual Numerology Forecast based on Vedic numerology principles.
 * Calculates the Personal Year number and generates yearly predictions
 * based on the birth date and current Universal Year.
 */

export interface PersonalYearData {
  personalYear: number;
  universalYear: number;
  birthDayNumber: number;
  birthMonthNumber: number;
  mulank: number;
  bhagyank: number;
}

export interface MonthlyForecast {
  month: string;
  monthHi: string;
  monthNumber: number;
  vibration: number;
  energy: string;
  advice: { en: string; hi: string };
  luckyDays: number[];
  caution: { en: string; hi: string };
}

export interface AnnualForecast {
  personalYear: number;
  universalYear: number;
  theme: { en: string; hi: string };
  overview: { en: string; hi: string };
  career: { en: string; hi: string };
  finance: { en: string; hi: string };
  health: { en: string; hi: string };
  relationships: { en: string; hi: string };
  spirituality: { en: string; hi: string };
  luckyColors: string[];
  luckyGemstones: string[];
  remedies: { en: string; hi: string }[];
  monthlyForecasts: MonthlyForecast[];
}

/**
 * Calculate the root digit (1-9) from any number.
 */
function rootDigit(n: number): number {
  if (n <= 0) return 0;
  let sum = n;
  while (sum > 9) {
    sum = String(sum).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return sum;
}

/**
 * Calculate Mulank (Driver Number) from birth date.
 */
export function calculateMulank(dob: string): number {
  const day = parseInt(dob.split('-')[2]);
  return rootDigit(day);
}

/**
 * Calculate Bhagyank (Conductor Number) from full birth date.
 */
export function calculateBhagyank(dob: string): number {
  const parts = dob.split('-').map(Number);
  return rootDigit(parts[0] + parts[1] + parts[2]);
}

/**
 * Calculate the Universal Year number for a given year.
 */
export function calculateUniversalYear(year: number): number {
  return rootDigit(year);
}

/**
 * Calculate the Personal Year number.
 * Personal Year = root(Birth Day + Birth Month + Universal Year)
 */
export function calculatePersonalYear(dob: string, year: number): number {
  const parts = dob.split('-').map(Number);
  const universalYear = calculateUniversalYear(year);
  return rootDigit(parts[1] + parts[2] + universalYear);
}

/**
 * Get personal year data for comprehensive analysis.
 */
export function getPersonalYearData(dob: string, year: number = new Date().getFullYear()): PersonalYearData {
  return {
    personalYear: calculatePersonalYear(dob, year),
    universalYear: calculateUniversalYear(year),
    birthDayNumber: rootDigit(parseInt(dob.split('-')[2])),
    birthMonthNumber: rootDigit(parseInt(dob.split('-')[1])),
    mulank: calculateMulank(dob),
    bhagyank: calculateBhagyank(dob)
  };
}

/**
 * Year themes for each Personal Year number (1-9).
 */
const YEAR_THEMES: Record<number, { theme: { en: string; hi: string }; overview: { en: string; hi: string } }> = {
  1: {
    theme: { en: 'New Beginnings', hi: 'नई शुरुआत' },
    overview: {
      en: 'Personal Year 1 marks a fresh start. It is a time for new initiatives, planting seeds, and setting intentions. Embrace independence and take bold steps forward.',
      hi: 'व्यक्तिगत वर्ष 1 एक नई शुरुआत कचिन्ह है। नई पहल, बीज बोने और इरादे बनाने क समय है। स्वतंत्रता क स्वीकार करें और बड़े कदम उठाएँ।'
    }
  },
  2: {
    theme: { en: 'Patience & Partnership', hi: 'धैर्य और साझेदारी' },
    overview: {
      en: 'Personal Year 2 is about patience, cooperation, and building relationships. Focus on diplomacy, teamwork, and nurturing the seeds planted in Year 1.',
      hi: 'व्यक्तिगत वर्ष 2 धैर्य, सहयोग और संबंध बनाने बारे में है। कूटनीति, टीम वर्क और वर्ष 1 में बोए गए बीजों क देखभाल पर ध्यान दें।'
    }
  },
  3: {
    theme: { en: 'Creativity & Expression', hi: 'रचनात्मकता और अभिव्यक्ति' },
    overview: {
      en: 'Personal Year 3 brings creativity, social activity, and self-expression. It is an excellent time for artistic pursuits, communication, and enjoying life.',
      hi: 'व्यक्तिगत वर्ष 3 रचनात्मकता, सामाजिक गतिविधि और आत्म-अभिव्यक्ति लाता है। कलात्मक प्रयासों, संचार और जीवन क आनंद लेन के लिए यह अच्छा समय है।'
    }
  },
  4: {
    theme: { en: 'Foundation & Discipline', hi: 'नींव और अनुशासन' },
    overview: {
      en: 'Personal Year 4 emphasizes hard work, discipline, and building solid foundations. Focus on practical matters, health, and creating order in your life.',
      hi: 'व्यक्तिगत वर्ष 4 कड़ी मेहनत, अनुशासन और मजबूत नींव बनाने पर जोर दता है। व्यावहारिक मामलों, स्वास्थ्य और जीवन में क्रम बनाने पर ध्यान दें।'
    }
  },
  5: {
    theme: { en: 'Change & Freedom', hi: 'परिवर्तन और स्वतंत्रता' },
    overview: {
      en: 'Personal Year 5 brings unexpected changes, adventure, and freedom. Embrace flexibility, travel, and new experiences. Avoid impulsive decisions.',
      hi: 'व्यक्तिगत वर्ष 5 अप्रत्याशित परिवर्तन, साहसिक कार्य और स्वतंत्रता लाता है। लचकता, यात्रा और नए अनुभवों क स्वीकार करें। आवेगपूर्ण निर्णयों सें बचें।'
    }
  },
  6: {
    theme: { en: 'Responsibility & Home', hi: 'जिम्मेदारी और घर' },
    overview: {
      en: 'Personal Year 6 focuses on home, family, and responsibility. It is a time for nurturing relationships, domestic harmony, and service to others.',
      hi: 'व्यक्तिगत वर्ष 6 घर, परिवार और जिम्मेदारी पर केंद्रित है। संबंधों क पालन, घरेलू सामंजस्य और दूसरों क सेव क समय है।'
    }
  },
  7: {
    theme: { en: 'Introspection & Wisdom', hi: 'आत्मचिंतन और ज्ञान' },
    overview: {
      en: 'Personal Year 7 is a time for inner growth, spiritual development, and self-analysis. Seek knowledge, practice meditation, and trust your intuition.',
      hi: 'व्यक्तिगत वर्ष 7 आंतरिक विकास, आध्यात्मिक विकास और आत्म-विश्लेषण क समय है। ज्ञान क खोज करें, ध्यान क अभ्यास करें और अपने अंतर्ज्ञान पर भरोसा करें।'
    }
  },
  8: {
    theme: { en: 'Abundance & Power', hi: 'समृद्धि और शक्ति' },
    overview: {
      en: 'Personal Year 8 brings material success, financial opportunities, and personal power. It is a time for career advancement, investments, and reaping rewards.',
      hi: 'व्यक्तिगत वर्ष 8 भौतिक सफलता, वित्तीय अवसर और व्यक्तिगत शक्ति लाता है। करियर प्रगति, निवेश और फल पाने क समय है।'
    }
  },
  9: {
    theme: { en: 'Completion & Release', hi: 'पूर्णता और मुक्तिकरण' },
    overview: {
      en: 'Personal Year 9 is about completion, letting go, and preparing for a new cycle. Clear old patterns, forgive, and release what no longer serves you.',
      hi: 'व्यक्तिगत वर्ष 9 पूर्णता, छोड़ देने और नए चक्र क लिए तैयारी बारे में है। पुराने पैटर्न साफ़ करें, क्षमा करें और उन चीजों को छोड़ दें जो अब आपकी सेवा नहीं करतीं।'
    }
  }
};

/**
 * Career forecasts for each personal year.
 */
const CAREER_FORECASTS: Record<number, { en: string; hi: string }> = {
  1: { en: 'Start new projects, seek leadership roles, and take initiative. A good year for career changes and entrepreneurship.', hi: 'नए प्रोजेक्ट शुरू करें, नेतृत्व भूमिकाओं क खोज करें और पहल करें। करियर परिवर्तन और उद्यमिता क लिए अच्छा वर्ष।' },
  2: { en: 'Focus on teamwork, partnerships, and diplomacy. Avoid confrontation; build alliances for long-term success.', hi: 'टीम वर्क, साझेदारियों और कूटनिति पर ध्यान दें। संघर्ष सें बचें; दीर्घकालिक सफलता क लिए गठबंधन बनाएँ।' },
  3: { en: 'Use creativity and communication skills. Networking and self-promotion will open doors. Consider creative fields.', hi: 'रचनानेतृत्व और संचार कौशल क उपयोग करें। नेटवर्किंग और आत्म-प्रचार द्वार खोलेंगे।' },
  4: { en: 'Build systems, improve skills, and establish routines. Hard work pays off. Focus on stability and organization.', hi: 'प्रणालियाँ बनाएँ, कौशल सुधारें और दिनचर्या स्थापित करें। कड़ी मेहनत क फल मिलेंगे।' },
  5: { en: 'Expect career changes or new opportunities through travel. Be adaptable. Sales, marketing, and dynamic roles suit you.', hi: 'यात्रा क माध्यम सें करियर परिवर्तन या नए अवसर क अपेक्षा करें। लचकदार रहें।' },
  6: { en: 'Focus on work-life balance. Teaching, counseling, and community service roles thrive. Family business may grow.', hi: 'कार्य-जीवन सन्तुलन पर ध्यान दें। शिक्षण, परामर्श और सामुदायिक सेवा भूमिकाएँ फलती हैं।' },
  7: { en: 'Research, analysis, and specialized skills are favored. Take time for study and skill development. Avoid rushing decisions.', hi: 'अनुसंधान, विश्लेषण और विशेषज्ञ कौशल क पसंद है। अध्ययन और कौशल विकास क लिए समय लें।' },
  8: { en: 'Peak career year. Expect promotions, raises, or business success. Make strategic investments and negotiate boldly.', hi: 'शिखर करियर वर्ष। पदोन्नति, वेतन वृद्धि या व्यापार सफलता क अपेक्षा करें।' },
  9: { en: 'Complete old projects and prepare for the next cycle. Let go of toxic work environments. Mentor others.', hi: 'पुराने प्रोजेक्ट पूर्ण करें और अगले चक्र क लिए तैयार हों। विषाक्त कार्य वातावरण सें बचें।' }
};

/**
 * Finance forecasts for each personal year.
 */
const FINANCE_FORECASTS: Record<number, { en: string; hi: string }> = {
  1: { en: 'Start new financial plans. Budget wisely and invest in yourself. Avoid risky ventures early in the year.', hi: 'नए वित्तीय योजनाएँ शुरू करें। समझदारी सें बजट बनाएँ और अपने में निवेश करें।' },
  2: { en: 'Financial growth through partnerships. Joint ventures and shared investments may prosper. Be patient with returns.', hi: 'साझेदारी क माध्यम सें वित्तीय वृद्धि। संयुक्त उद्यम और साझा निवेश फल सकते हैं।' },
  3: { en: 'Creative projects may bring income. Watch for overspending on social activities. Diversify your income sources.', hi: 'रचनानेतृत्व प्रोजेक्ट आय ला सकते हैं। सामाजिक गतिविधियों पर अतिव्यय क ध्यान रखें।' },
  4: { en: 'Conservative financial management. Save, pay debts, and build emergency funds. Real estate investments are favorable.', hi: 'संरक्षक वित्तीय प्रबंधन। बचत करें, ऋण चुकाएँ और आपातकालीन निधि बनाएँ।' },
  5: { en: 'Unexpected financial changes. Windfalls possible, but so are unexpected expenses. Stay flexible with your budget.', hi: 'अप्रत्याशित वित्तीय परिवर्तन। अचानक लाभ संभव, लेकिन अप्रत्याशित खर्च भी।' },
  6: { en: 'Family-related expenses increase. Home improvements and health costs. Financial stability through responsibility.', hi: 'परिवार-संबंधित खर्च बढ़ते हैं। घर क सुधार और स्वास्थ्य लागत।' },
  7: { en: 'Invest in knowledge and spiritual growth. Financial gains through expertise. Avoid impulsive purchases.', hi: 'ज्ञान और आध्यात्मिक विकास में निवेश करें। विशेषज्ञता के माध्यम से वित्तीय लाभ।' },
  8: { en: 'Best year for financial gains. Major investments, business expansion, and wealth accumulation. Negotiate from strength.', hi: 'वित्तीय लाभ के लिए सर्वोत्तम वर्ष। बड़े निवेश, व्यापार विस्तार और धन संचय।' },
  9: { en: 'Clear debts and financial obligations. Let go of material attachments. Prepare financially for the new cycle.', hi: 'ऋण और वित्तीय दायित्व साफ करें। भौतिक आसक्तियों को छोड़ दें।' }
};

/**
 * Health forecasts for each personal year.
 */
const HEALTH_FORECASTS: Record<number, { en: string; hi: string }> = {
  1: { en: 'Start a new fitness routine. Focus on vitality and energy. Begin healthy habits that will sustain you through the cycle.', hi: 'नई फिटनेस दिनचर्या शुरू करें। जीवनशक्ति और ऊर्जा पर ध्यान दें।' },
  2: { en: 'Balance rest and activity. Watch for stress from relationships. Gentle exercise like yoga and walking is ideal.', hi: 'आराम और गतिविधि का संतुलन रखें। संबंधों से तनाव का ध्यान रखें।' },
  3: { en: 'High energy but risk of overindulgence. Watch diet and social drinking. Creative activities support mental health.', hi: 'उच्च ऊर्जा लेकिन अतिभोग का जोखिम। आहार और सामाजिक पेय का ध्यान रखें।' },
  4: { en: 'Best year for building health foundations. Regular exercise, proper diet, and medical check-ups are essential.', hi: 'स्वास्थ्य नींव बनाने के लिए सर्वोत्तम वर्ष। नियमित व्यायाम, उचित आहार और चिकित्सा जाँच आवश्यक हैं।' },
  5: { en: 'Restless energy needs outlet. Travel and adventure sports help. Avoid excess and maintain discipline despite freedom.', hi: 'अशांत ऊर्जा को निष्कासन की आवश्यकता है। यात्रा और साहसिक खेल मदद करते हैं।' },
  6: { en: 'Focus on family health and home wellness. Nutrition and domestic harmony affect your well-being. Watch for weight gain.', hi: 'परिवार स्वास्थ्य और घरेलू कल्याण पर ध्यान दें। आहार और घरेलू सामंजस्य आपके कल्याण को प्रभावित करते हैं।' },
  7: { en: 'Spiritual practices support health. Meditation, retreats, and introspection heal. Trust your body\'s wisdom.', hi: 'आध्यात्मिक अभ्यास स्वास्थ्य का समर्थन करते हैं। ध्यान, रिट्रीट और आत्मचिंतन उपचार करते हैं।' },
  8: { en: 'High stress from career demands. Manage workload and prioritize self-care. Exercise to release tension.', hi: 'करियर की मांगों से उच्च तनाव। कार्यभार प्रबंधित करें और स्व-देखभाल को प्राथमिकता दें।' },
  9: { en: 'Release old health patterns. Detox, cleansing, and letting go of bad habits. Prepare for a fresh health cycle.', hi: 'पुराने स्वास्थ्य पैटर्न छोड़ें। विषाक्त पदार्थों से मुक्ति, सफाई और बुरी आदतों को छोड़ें।' }
};

/**
 * Relationship forecasts for each personal year.
 */
const RELATIONSHIP_FORECASTS: Record<number, { en: string; hi: string }> = {
  1: { en: 'New relationships may begin. Take initiative in love. Independence is key — avoid codependency.', hi: 'नए संबंध शुरू हो सकते हैं। प्रेम में पहल करें। स्वतंत्रता महत्वपूर्ण है।' },
  2: { en: 'Best year for partnerships and romance. Deepen existing bonds. Compromise and patience strengthen relationships.', hi: 'साझेदारियों और रोमांस के लिए सर्वोत्तम वर्ष। मौजूदा बंधनों को गहरा करें।' },
  3: { en: 'Social butterfly year. Meet new people through creative and social activities. Communication strengthens bonds.', hi: 'सामाजिक वर्ष। रचनात्मक और सामाजिक गतिविधियों के माध्यम से नए लोगों से मिलें।' },
  4: { en: 'Build stable, committed relationships. Focus on trust and reliability. Family bonds strengthen.', hi: 'स्थिर, प्रतिबद्ध संबंध बनाएँ। विश्वास और विश्वसनीयता पर ध्यान दें।' },
  5: { en: 'Relationships undergo changes. Freedom and adventure attract partners. Avoid restlessness in commitments.', hi: 'संबंधों में परिवर्तन होते हैं। स्वतंत्रता और साहसिक कार्य भागीदारों को आकर्षित करते हैं।' },
  6: { en: 'Peak relationship year. Marriage, commitment, and family harmony. Nurturing others brings fulfillment.', hi: 'शिखर संबंध वर्ष। विवाह, प्रतिबद्धता और परिवार सामंजस्य।' },
  7: { en: 'Solitude is needed. Relationships deepen through spiritual connection. Quality over quantity in friendships.', hi: 'एकांत की आवश्यकता है। आध्यात्मिक कनेक्शन के माध्यम से संबंध गहरे होते हैं।' },
  8: { en: 'Power dynamics in relationships. Balance career ambition with personal life. Mutual respect and shared goals matter.', hi: 'संबंधों में शक्ति गतिशीलता। करियर महत्वाकांक्षा और व्यक्तिगत जीवन का संतुलन रखें।' },
  9: { en: 'Relationships may end or transform. Forgive and release old grudges. Compassion and universal love prevail.', hi: 'संबंध समाप्त या परिवर्तित हो सकते हैं। क्षमा करें और पुरानी कड़वाहट छोड़ दें।' }
};

/**
 * Spirituality forecasts for each personal year.
 */
const SPIRITUALITY_FORECASTS: Record<number, { en: string; hi: string }> = {
  1: { en: 'Begin a new spiritual practice. Set intentions for inner growth. Explore meditation or prayer.', hi: 'नया आध्यात्मिक अभ्यास शुरू करें। आंतरिक विकास के लिए इरादे बनाएँ।' },
  2: { en: 'Develop patience and trust. Spiritual growth through relationships and service. Practice empathy.', hi: 'धैर्य और विश्वास विकसित करें। संबंधों और सेवा के माध्यम से आध्यात्मिक विकास।' },
  3: { en: 'Creative spirituality flourishes. Art, music, and writing become spiritual outlets. Joy is your practice.', hi: 'रचनात्मक आध्यात्मिकता फलती है। कला, संगीत और लेखन आध्यात्मिक मार्ग बनते हैं।' },
  4: { en: 'Disciplined spiritual practice. Build a daily routine of prayer, meditation, or study. Ground your spirituality.', hi: 'अनुशासित आध्यात्मिक अभ्यास। प्रार्थना, ध्यान या अध्ययन की दैनिक दिनचर्या बनाएँ।' },
  5: { en: 'Spiritual adventure and exploration. Travel to sacred sites. Question dogmas and find your own truth.', hi: 'आध्यात्मिक साहसिक कार्य और खोज। पवित्र स्थलों पर यात्रा करें।' },
  6: { en: 'Service to others is your spiritual path. Family and community become your temple. Love is the highest practice.', hi: 'दूसरों की सेवा आपका आध्यात्मिक मार्ग है। परिवार और समुदाय आपका मंदिर बनते हैं।' },
  7: { en: 'Peak spiritual year. Deep meditation, study of sacred texts, and inner wisdom. Solitude reveals truth.', hi: 'शिखर आध्यात्मिक वर्ष। गहरा ध्यान, पवित्र ग्रंथों का अध्ययन और आंतरिक ज्ञान।' },
  8: { en: 'Spiritual power and manifestation. Use your influence for good. Material success supports spiritual goals.', hi: 'आध्यात्मिक शक्ति और प्रकटिकरण। अच्छे के लिए अपनी प्रभावशाली शक्ति का उपयोग करें।' },
  9: { en: 'Spiritual completion and transcendence. Let go of attachments. Universal love and compassion guide you.', hi: 'आध्यात्मिक पूर्णता और पारमार्थिकता। आसक्तियों को छोड़ दें। सार्वभौमिक प्रेम और करुणा आपका मार्गदर्शन करें।' }
};

/**
 * Generate the complete annual forecast for a given birth date.
 */
export function generateAnnualForecast(dob: string, year: number = new Date().getFullYear(), language: Language = 'en'): AnnualForecast {
  const data = getPersonalYearData(dob, year);
  const py = data.personalYear;

  const themes = YEAR_THEMES[py] || YEAR_THEMES[1];
  const months = [
    { month: 'January', monthHi: 'जनवरी', monthNumber: 1 },
    { month: 'February', monthHi: 'फरवरी', monthNumber: 2 },
    { month: 'March', monthHi: 'मार्च', monthNumber: 3 },
    { month: 'April', monthHi: 'अप्रैल', monthNumber: 4 },
    { month: 'May', monthHi: 'मई', monthNumber: 5 },
    { month: 'June', monthHi: 'जून', monthNumber: 6 },
    { month: 'July', monthHi: 'जुलाई', monthNumber: 7 },
    { month: 'August', monthHi: 'अगस्त', monthNumber: 8 },
    { month: 'September', monthHi: 'सितंबर', monthNumber: 9 },
    { month: 'October', monthHi: 'अक्टूबर', monthNumber: 10 },
    { month: 'November', monthHi: 'नवंबर', monthNumber: 11 },
    { month: 'December', monthHi: 'दिसंबर', monthNumber: 12 }
  ];

  // Generate monthly forecasts
  const monthlyForecasts: MonthlyForecast[] = months.map((m) => {
    const monthVibration = rootDigit(py + m.monthNumber);
    const monthTheme = YEAR_THEMES[monthVibration] || YEAR_THEMES[1];

    // Lucky days based on mulank
    const friendlyNumbers: Record<number, number[]> = {
      1: [1, 2, 3, 5, 9],
      2: [1, 2, 5, 7],
      3: [1, 3, 5, 7, 9],
      4: [1, 4, 5, 6],
      5: [1, 3, 5, 6],
      6: [4, 5, 6, 8],
      7: [1, 3, 5, 7],
      8: [3, 5, 6, 8],
      9: [1, 3, 5, 9]
    };

    const luckyDays = friendlyNumbers[data.mulank] || [1, 5, 9];

    // Generate day numbers for the month that match lucky days
    const daysInMonth = new Date(year, m.monthNumber, 0).getDate();
    const luckyDayNumbers = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (luckyDays.includes(rootDigit(d))) {
        luckyDayNumbers.push(d);
      }
    }

    return {
      month: m.month,
      monthHi: m.monthHi,
      monthNumber: m.monthNumber,
      vibration: monthVibration,
      energy: language === 'hi' ? monthTheme.theme.hi : monthTheme.theme.en,
      advice: {
        en: getMonthAdvice(monthVibration, 'en'),
        hi: getMonthAdvice(monthVibration, 'hi')
      },
      luckyDays: luckyDayNumbers.slice(0, 8), // Limit to 8 lucky days
      caution: {
        en: getMonthCaution(monthVibration, 'en'),
        hi: getMonthCaution(monthVibration, 'hi')
      }
    };
  });

  // Lucky colors based on mulank
  const luckyColorsMap: Record<number, string[]> = {
    1: ['Gold', 'Orange', 'Yellow'],
    2: ['White', 'Silver', 'Cream'],
    3: ['Yellow', 'Gold', 'Saffron'],
    4: ['Blue', 'Grey', 'Electric Blue'],
    5: ['Green', 'Emerald Green'],
    6: ['Pink', 'White', 'Silver'],
    7: ['Pastel Shades', 'Light Green'],
    8: ['Blue', 'Black', 'Dark Blue'],
    9: ['Red', 'Pink', 'Coral']
  };

  // Lucky gemstones based on mulank
  const gemstonesMap: Record<number, string[]> = {
    1: ['Ruby'],
    2: ['Pearl'],
    3: ['Yellow Sapphire'],
    4: ['Hessonite'],
    5: ['Emerald'],
    6: ['Diamond'],
    7: ["Cat's Eye"],
    8: ['Blue Sapphire'],
    9: ['Red Coral']
  };

  // Remedies based on mulank
  const remediesMap: Record<number, { en: string; hi: string }[]> = {
    1: [
      { en: 'Offer water to the Sun every morning facing East.', hi: 'हर सुबह पूर्व की ओर मुख करके सूर्य को जल दें।' },
      { en: 'Wear Ruby on Sunday for enhanced confidence.', hi: 'आत्मविश्वास बढ़ाने के लिए रविवार को माणिक पहनें।' },
      { en: 'Chant "Om Suryaya Namaha" 108 times on Sundays.', hi: 'रविवार को "ॐ सूर्याय नमः" 108 बार जाप करें।' }
    ],
    2: [
      { en: 'Respect your mother and offer prayers to the Moon.', hi: 'माता का सम्मान करें और चंद्रमा को प्रार्थना करें।' },
      { en: 'Wear Pearl on Monday for emotional balance.', hi: 'भावनात्मक संतुलन के लिए सोमवार को मोती पहनें।' },
      { en: 'Chant "Om Chandraya Namaha" 108 times on Mondays.', hi: 'सोमवार को "ॐ चंद्राय नमः" 108 बार जाप करें।' }
    ],
    3: [
      { en: 'Respect teachers and apply saffron tilak.', hi: 'गुरुओं का आदर करें और माथे पर केसर का तिलक लगाएं।' },
      { en: 'Wear Yellow Sapphire on Thursday for wisdom.', hi: 'ज्ञान के लिए गुरुवार को पुखराज पहनें।' },
      { en: 'Chant "Om Gurave Namaha" 108 times on Thursdays.', hi: 'गुरुवार को "ॐ गुरवे नमः" 108 बार जाप करें।' }
    ],
    4: [
      { en: 'Feed street dogs and keep your home clean.', hi: 'कुत्तों को रोटी दें और घर साफ रखें।' },
      { en: 'Wear Hessonite on Monday for protection.', hi: 'सुरक्षा के लिए सोमवार को गोमेद पहनें।' },
      { en: 'Chant "Om Rahave Namaha" 108 times on Mondays.', hi: 'सोमवार को "ॐ राहवे नमः" 108 बार जाप करें।' }
    ],
    5: [
      { en: 'Feed green grass to cows and help sisters.', hi: 'गाय को हरी घास खिलाएं और बहनों की मदद करें।' },
      { en: 'Wear Emerald on Wednesday for communication skills.', hi: 'संचार कौशल के लिए बुधवार को पन्ना पहनें।' },
      { en: 'Chant "Om Budhaya Namaha" 108 times on Wednesdays.', hi: 'बुधवार को "ॐ बुधाय नमः" 108 बार जाप करें।' }
    ],
    6: [
      { en: 'Use perfume and respect women in your life.', hi: 'इत्र लगाएं और अपने जीवन में महिलाओं का सम्मान करें।' },
      { en: 'Wear Diamond on Friday for love and harmony.', hi: 'प्रेम और सामंजस्य के लिए शुक्रवार को हीरा पहनें।' },
      { en: 'Chant "Om Shukraya Namaha" 108 times on Fridays.', hi: 'शुक्रवार को "ॐ शुक्राय नमः" 108 बार जाप करें।' }
    ],
    7: [
      { en: 'Feed birds and practice daily meditation.', hi: 'पक्षियों को दाना डालें और दैनिक ध्यान का अभ्यास करें।' },
      { en: 'Wear Cat\'s Eye on Monday for intuition.', hi: 'अंतर्ज्ञान के लिए सोमवार को लहसुनिया पहनें।' },
      { en: 'Chant "Om Ketave Namaha" 108 times on Mondays.', hi: 'सोमवार को "ॐ केतवे नमः" 108 बार जाप करें।' }
    ],
    8: [
      { en: 'Help the needy and light an oil lamp on Saturday.', hi: 'गरीबों की मदद करें और शनिवार को दीप जलाएं।' },
      { en: 'Wear Blue Sapphire on Saturday for career success.', hi: 'करियर सफलता के लिए शनिवार को नीलम पहनें।' },
      { en: 'Chant "Om Shanaye Namaha" 108 times on Saturdays.', hi: 'शनिवार को "ॐ शनये नमः" 108 बार जाप करें।' }
    ],
    9: [
      { en: 'Help siblings and read spiritual texts daily.', hi: 'भाई-बहनों की मदद करें और दैनिक आध्यात्मिक पाठ पढ़ें।' },
      { en: 'Wear Red Coral on Tuesday for courage.', hi: 'साहस के लिए मंगलवार को मूंगा पहनें।' },
      { en: 'Chant "Om Angarakaya Namaha" 108 times on Tuesdays.', hi: 'मंगलवार को "ॐ अंगारकाय नमः" 108 बार जाप करें।' }
    ]
  };

  return {
    personalYear: py,
    universalYear: data.universalYear,
    theme: themes.theme,
    overview: themes.overview,
    career: CAREER_FORECASTS[py] || CAREER_FORECASTS[1],
    finance: FINANCE_FORECASTS[py] || FINANCE_FORECASTS[1],
    health: HEALTH_FORECASTS[py] || HEALTH_FORECASTS[1],
    relationships: RELATIONSHIP_FORECASTS[py] || RELATIONSHIP_FORECASTS[1],
    spirituality: SPIRITUALITY_FORECASTS[py] || SPIRITUALITY_FORECASTS[1],
    luckyColors: luckyColorsMap[data.mulank] || ['Gold', 'Yellow'],
    luckyGemstones: gemstonesMap[data.mulank] || ['Ruby'],
    remedies: remediesMap[data.mulank] || remediesMap[1],
    monthlyForecasts
  };
}

/**
 * Get monthly advice based on vibration number.
 */
function getMonthAdvice(vibration: number, lang: 'en' | 'hi'): string {
  const advice: Record<number, { en: string; hi: string }> = {
    1: { en: 'Start new initiatives and take bold action. Leadership opportunities arise.', hi: 'नई पहल शुरू करें और बड़े कदम उठाएँ। नेतृत्व के अवसर उत्पन्न होते हैं।' },
    2: { en: 'Practice patience and cooperation. Build bridges, not walls.', hi: 'धैर्य और सहयोग का अभ्यास करें। सेतु बनाएँ, दीवारें नहीं।' },
    3: { en: 'Express yourself creatively. Social gatherings bring joy and opportunities.', hi: 'रचनात्मक रूप से स्वयं को व्यक्त करें। सामाजिक सभाएँ आनंद और अवसर लाती हैं।' },
    4: { en: 'Focus on practical matters and discipline. Build strong foundations.', hi: 'व्यावहारिक मामलों और अनुशासन पर ध्यान दें। मजबूत नींव बनाएँ।' },
    5: { en: 'Embrace change and adventure. Flexibility is your greatest asset.', hi: 'परिवर्तन और साहसिक कार्य को स्वीकार करें। लचीलापन आपकी सबसे बड़ी संपत्ति है।' },
    6: { en: 'Nurture relationships and home. Service to others brings rewards.', hi: 'संबंधों और घर की देखभाल करें। दूसरों की सेवा से पुरस्कार मिलते हैं।' },
    7: { en: 'Seek inner wisdom through study and meditation. Trust your intuition.', hi: 'अध्ययन और ध्यान के माध्यम से आंतरिक ज्ञान की खोज करें। अपने अंतर्ज्ञान पर भरोसा करें।' },
    8: { en: 'Pursue material goals with confidence. Financial opportunities abound.', hi: 'आत्मविश्वास के साथ भौतिक लक्ष्यों का पीछा करें। वित्तीय अवसरों की भरमार है।' },
    9: { en: 'Complete old cycles and let go. Compassion and forgiveness open new doors.', hi: 'पुराने चक्र पूर्ण करें और छोड़ दें। करुणा और क्षमा नए द्वार खोलती हैं।' }
  };
  const a = advice[vibration] || advice[1];
  return lang === 'hi' ? a.hi : a.en;
}

/**
 * Get monthly caution based on vibration number.
 */
function getMonthCaution(vibration: number, lang: 'en' | 'hi'): string {
  const cautions: Record<number, { en: string; hi: string }> = {
    1: { en: 'Avoid being too aggressive or selfish. Listen to others.', hi: 'बहुत आक्रामक या स्वार्थी होने से बचें। दूसरों की सुनें।' },
    2: { en: 'Don\'t be overly sensitive or passive. Assert your needs gently.', hi: 'अत्यधिक संवेदनशील या निष्क्रिय न हों। अपनी जरूरतों को कोमलता से व्यक्त करें।' },
    3: { en: 'Watch for scattered energy and overspending. Stay focused.', hi: 'खिंचे हुए ऊर्जा और अतिव्यय का ध्यान रखें। केंद्रित रहें।' },
    4: { en: 'Avoid being too rigid or stubborn. Flexibility prevents burnout.', hi: 'बहुत कठोर या अड़ियल होने से बचें। लचीलापन थकान से बचाता है।' },
    5: { en: 'Don\'t make impulsive decisions. Restlessness can lead to mistakes.', hi: 'आवेगपूर्ण निर्णय न लें। बेचैनी गलतियों की ओर ले जा सकती है।' },
    6: { en: 'Avoid being overly critical or controlling. Balance giving with receiving.', hi: 'अत्यधिक आलोचनात्मक या नियंत्रण करने वाले होने से बचें। देने और लेने का संतुलन रखें।' },
    7: { en: 'Don\'t isolate yourself completely. Balance solitude with social connection.', hi: 'स्वयं को पूरी तरह अलग न करें। एकांत और सामाजिक कनेक्शन का संतुलन रखें।' },
    8: { en: 'Avoid greed and power struggles. Ethical success is lasting success.', hi: 'लालच और शक्ति संघर्ष से बचें। नैतिक सफलता ही स्थायी सफलता है।' },
    9: { en: 'Don\'t cling to the past. Letting go is the path to renewal.', hi: 'अतीत से पकड़े न रहें। छोड़ देना नवीनीकरण का मार्ग है।' }
  };
  const c = cautions[vibration] || cautions[1];
  return lang === 'hi' ? c.hi : c.en;
}
