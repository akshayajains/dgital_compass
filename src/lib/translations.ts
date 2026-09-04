import { DirectionInfo } from '@/types/compass';

export const translations = {
  hi: {
    appTitle: 'Digital Compass 360°',
    appSubtitle: 'सटीक 360° दिशा, वास्तु एवं लेवल दर्शक',
    tabCompass: 'कंपास',
    tabLevel: 'लेवल',
    trueNorth: 'उत्तर',
    magneticNorth: 'चुंबकीय',
    trueNorthMode: 'सच्चा उत्तर (True North)',
    magneticNorthMode: 'चुंबकीय उत्तर (Magnetic)',
    sound: 'ध्वनि',
    soundOn: 'ध्वनि चालू',
    soundOff: 'ध्वनि मूक',
    qibla: 'किबला (काबा)',
    torch: 'टॉर्च',
    share: 'साझा',
    settings: 'सेटिंग्स',
    theme: 'थीम',
    styles: 'डायल स्टाइल',
    styleGallery: 'सभी 12+ डायल स्टाइल',
    resetTare: 'रीसेट करें',
    setTare: 'शून्य तय करें (Zero)',
    pitch: 'पिच (आगे-पीछे)',
    roll: 'रोल (दाएं-बाएं)',
    tilt: 'झुकाव',
    perfectLevel: '✓ 0.0° पूर्ण समतल',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    altitude: 'ऊंचाई',
    feet: 'फीट',
    meters: 'मीटर',
    accuracy: 'सटीकता',
    highestAccuracy: 'उच्चतम शुद्धता (Low-pass Filter)',
    calibrated: 'कैलिब्रेटेड',
    weatherDescFallback: 'सुहावना मौसम',
    clearSky: 'साफ़ आसमान',
    fewClouds: 'हल्के बादल',
    fog: 'कोहरा',
    rain: 'वर्षा',
    showers: 'बौछारें',
    thunderstorm: 'गरज के साथ वर्षा',
    facingQibla: '✓ मक्का किबला की सटीक दिशा',
    qiblaBearing: 'मक्का (किबला) दिशा',
    distance: 'दूरी',
    km: 'किमी',
    sunPosition: 'सूर्य',
    vastuGrid: 'वास्तु ग्रिड',
    sensorDiagnostics: 'सेंसर डायग्नोस्टिक्स',
    check: 'जांचें',
    calibrationGuide: 'कैलिब्रेशन गाइड (8-आकृति)',
    view: 'देखें',
    language: 'भाषा / Language',
    themeMode: 'थीम मोड',
    light: 'लाइट',
    dark: 'डार्क',
    system: 'सिस्टम',
    close: 'बंद करें',
    copiedToast: 'निर्देशांक और दिशा कॉपी हो गए!',
    calibTitle: 'सेंसर कैलिब्रेशन (8-आकृति गति)',
    calibSubtitle: 'सटीक 360° दिशा व शून्य विचलन प्राप्त करने के लिए अपने फोन को हवा में 8 के आकार में घुमाएं।',
    calibStep1: 'फोन को हाथ में सीधा पकड़ें और 3-4 बार बड़े 8 के आकार में घुमाएं।',
    calibStep2: 'किसी भी भारी धातु, स्पीकर या चुंबकीय आवरण से दूर रहें।',
    calibStep3: 'कैलिब्रेशन होते ही सुई सटीक दिशा में स्वतः स्थिर हो जाएगी।',
    calibDone: 'समझ आ गया • कैलिब्रेट हुआ',
    sensorTitle: 'हार्डवेयर सेंसर डायग्नोस्टिक्स',
    sensorSubtitle: 'डिवाइस ओरिएंटेशन, जाइरोस्कोप व मैग्नेटोमीटर की लाइव स्थिति',
    compassHeading: 'कंपास दिशा',
    pitchTilt: 'पिच झुकाव',
    rollTilt: 'रोल झुकाव',
    sensorAccuracy: 'सेंसर शुद्धता',
    magnetometerActive: 'मैग्नेटोमीटर सक्रिय',
    pitchDesc: 'आगे-पीछे का झुकाव कोण',
    rollDesc: 'दाएं-बाएं का झुकाव कोण',
    lowPassFilter: 'स्मूथ वेक्टर फ़िल्टर सक्रिय',
    tabVastu: 'वास्तु एवं अन्य',
    subLevelBullseye: '2D बुलआई',
    subLevelDualVials: 'ड्यूल वायल',
    tareZero: 'शून्य तय करें',
    highTilt: 'अधिक झुकाव कोण',
    perfectLevelText: 'पूर्ण समतल स्तर',
    totalTilt: 'कुल झुकाव',
    pitchX: 'पिच (X-अक्ष)',
    rollY: 'रोल (Y-अक्ष)',
    slopePercent: 'ढलान (%)',
    roofRatio: 'छत अनुपात',
    creatorTitle: 'BY AADISH JAIN',
    creatorBadge: 'CREATOR',
    creatorSubtitle: 'Spiritual & Vastu Guidance Services',
    creatorFooter: 'Made with ❤️ for Spiritual Alignment',
    vialHorizontal: 'क्षैतिज वायल (रोल)',
    vialVertical: 'ऊर्ध्वाधर वायल (पिच)',
    vastuReportTitle: 'वास्तु एवं दिशा संपूर्ण मार्गदर्शिका',
    vastuReportSubtitle: 'समस्त 8 दिशाओं के तत्व, देवता एवं गृह निर्माण सुझाव',
    categories: {
      all: 'सभी स्टाइल',
      classic: 'क्लासिक',
      modern: 'आधुनिक',
      tactical: 'टैक्टिकल',
      luxury: 'लग्जरी',
      mystic: 'वैदिक / रहस्यमयी'
    }
  },
  en: {
    appTitle: 'Digital Compass 360°',
    appSubtitle: 'Precision 360° Direction, Vastu & Spirit Level',
    tabCompass: 'Compass',
    tabLevel: 'Level',
    trueNorth: 'True N',
    magneticNorth: 'Mag N',
    trueNorthMode: 'True North',
    magneticNorthMode: 'Magnetic North',
    sound: 'Sound',
    soundOn: 'Sound On',
    soundOff: 'Sound Muted',
    qibla: 'Qibla',
    torch: 'Torch',
    share: 'Share',
    settings: 'Settings',
    theme: 'Theme',
    styles: 'Dial Styles',
    styleGallery: 'All 12+ Dial Styles',
    resetTare: 'Reset Zero',
    setTare: 'Set Zero (Tare)',
    pitch: 'Pitch (Front/Back)',
    roll: 'Roll (Left/Right)',
    tilt: 'Tilt',
    perfectLevel: '✓ 0.0° Perfectly Level',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    altitude: 'Altitude',
    feet: 'ft',
    meters: 'm',
    accuracy: 'Accuracy',
    highestAccuracy: 'High Precision (Low-pass Filter)',
    calibrated: 'Calibrated',
    weatherDescFallback: 'Pleasant Weather',
    clearSky: 'Clear Sky',
    fewClouds: 'Partly Cloudy',
    fog: 'Foggy',
    rain: 'Rainy',
    showers: 'Showers',
    thunderstorm: 'Thunderstorm',
    facingQibla: '✓ Aligned with Holy Kaaba (Qibla)',
    qiblaBearing: 'Qibla (Makkah) Bearing',
    distance: 'Distance',
    km: 'km',
    sunPosition: 'Sun',
    vastuGrid: 'Vastu Grid',
    sensorDiagnostics: 'Sensor Diagnostics',
    check: 'Inspect',
    calibrationGuide: 'Calibration Guide (Figure-8)',
    view: 'View',
    language: 'Language / भाषा',
    themeMode: 'Theme Mode',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    close: 'Close',
    copiedToast: 'Coordinates & Heading copied!',
    calibTitle: 'Sensor Calibration (Figure-8 Motion)',
    calibSubtitle: 'Wave your device in a figure-8 motion in the air to eliminate magnetic bias and calibrate sensors.',
    calibStep1: 'Hold your device firmly and wave it in a smooth figure-8 motion 3-4 times.',
    calibStep2: 'Stay clear of large metallic objects, magnets, or laptop speakers.',
    calibStep3: 'The compass needle stabilizes instantly once optimal calibration is reached.',
    calibDone: 'Understood • Calibrated',
    sensorTitle: 'Hardware Sensor Diagnostics',
    sensorSubtitle: 'Live status and accuracy of Orientation, Gyroscope & Magnetometer',
    compassHeading: 'Compass Heading',
    pitchTilt: 'Pitch Angle',
    rollTilt: 'Roll Angle',
    sensorAccuracy: 'Sensor Accuracy',
    magnetometerActive: 'Magnetometer Active',
    pitchDesc: 'Pitch inclination (X-axis)',
    rollDesc: 'Roll inclination (Y-axis)',
    lowPassFilter: 'Smooth Vector Low-pass Active',
    tabVastu: 'VASTU & OTHERS',
    subLevelBullseye: '2D BULLSEYE',
    subLevelDualVials: 'DUAL VIALS',
    tareZero: 'TARE ZERO',
    highTilt: 'HIGH TILT ANGLE',
    perfectLevelText: 'PERFECTLY LEVEL',
    totalTilt: 'Total Tilt',
    pitchX: 'PITCH (X-AXIS)',
    rollY: 'ROLL (Y-AXIS)',
    slopePercent: 'SLOPE (%)',
    roofRatio: 'ROOF RATIO',
    creatorTitle: 'BY AADISH JAIN',
    creatorBadge: 'CREATOR',
    creatorSubtitle: 'Spiritual & Vastu Guidance Services',
    creatorFooter: 'Made with ❤️ for Spiritual Alignment',
    vialHorizontal: 'HORIZONTAL VIAL (ROLL)',
    vialVertical: 'VERTICAL VIAL (PITCH)',
    vastuReportTitle: 'Vastu & Directions Comprehensive Guide',
    vastuReportSubtitle: 'Elements, Deities & Architectural Recommendations for all 8 Directions',
    categories: {
      all: 'All Styles',
      classic: 'Classic',
      modern: 'Modern',
      tactical: 'Tactical',
      luxury: 'Luxury',
      mystic: 'Vedic / Mystic'
    }
  }
};

export const getVastuDetails = (deg: number | null, lang: 'hi' | 'en'): DirectionInfo => {
  if (deg === null || isNaN(deg)) {
    return lang === 'hi'
      ? {
          name: 'उत्तर (North)',
          code: 'N',
          vastuTitle: 'कुबेर स्थान (उत्तर)',
          vastuDesc: 'धन, व्यापार व समृद्धि • जल तत्व',
          color: 'text-red-400',
          element: 'जल तत्व (Water)',
          deity: 'कुबेर (Lord Kuber)'
        }
      : {
          name: 'North (उत्तर)',
          code: 'N',
          vastuTitle: 'Kuber Sector (North)',
          vastuDesc: 'Wealth, Career & Prosperity • Water Element',
          color: 'text-red-400',
          element: 'Water Element',
          deity: 'Lord Kuber'
        };
  }

  const norm = ((deg % 360) + 360) % 360;

  if (norm >= 337.5 || norm < 22.5) {
    return lang === 'hi'
      ? {
          name: 'उत्तर (North)',
          code: 'N',
          vastuTitle: 'कुबेर स्थान (उत्तर)',
          vastuDesc: 'धन, व्यापार व समृद्धि • जल तत्व',
          color: 'text-red-400',
          element: 'जल (Water)',
          deity: 'कुबेर'
        }
      : {
          name: 'North (उत्तर)',
          code: 'N',
          vastuTitle: 'Kuber Zone (North)',
          vastuDesc: 'Wealth, Opportunities & Financial Flow • Water',
          color: 'text-red-400',
          element: 'Water',
          deity: 'Kuber'
        };
  }

  if (norm >= 22.5 && norm < 67.5) {
    return lang === 'hi'
      ? {
          name: 'ईशान (North-East)',
          code: 'NE',
          vastuTitle: 'मंदिर व पूजा स्थल (Ishan)',
          vastuDesc: 'देव स्थान • ध्यान, ज्ञान व सकारात्मक ऊर्जा',
          color: 'text-yellow-400',
          element: 'जल/ईथर (Water/Ether)',
          deity: 'ईशान/शिव'
        }
      : {
          name: 'North-East (ईशान)',
          code: 'NE',
          vastuTitle: 'Temple & Meditation (Ishan)',
          vastuDesc: 'Divine Zone • Clarity, Wisdom & Pure Energy',
          color: 'text-yellow-400',
          element: 'Water/Ether',
          deity: 'Ishan (Shiva)'
        };
  }

  if (norm >= 67.5 && norm < 112.5) {
    return lang === 'hi'
      ? {
          name: 'पूर्व (East)',
          code: 'E',
          vastuTitle: 'इंद्र स्थान (पूर्व)',
          vastuDesc: 'मुख्य द्वार, स्वास्थ्य, मान-सम्मान व नव ऊर्जा',
          color: 'text-emerald-400',
          element: 'वायु (Air)',
          deity: 'इंद्र/सूर्य'
        }
      : {
          name: 'East (पूर्व)',
          code: 'E',
          vastuTitle: 'Indra Sector (East)',
          vastuDesc: 'Main Entrance, Health, Social Connections & Vitality',
          color: 'text-emerald-400',
          element: 'Air/Sun',
          deity: 'Indra/Surya'
        };
  }

  if (norm >= 112.5 && norm < 157.5) {
    return lang === 'hi'
      ? {
          name: 'आग्नेय (South-East)',
          code: 'SE',
          vastuTitle: 'रसोई व अग्नि तत्व (Agneya)',
          vastuDesc: 'भोजन, ऊर्जा, गतिशीलता व पाचन शक्ति',
          color: 'text-orange-400',
          element: 'अग्नि (Fire)',
          deity: 'अग्नि देव'
        }
      : {
          name: 'South-East (आग्नेय)',
          code: 'SE',
          vastuTitle: 'Kitchen & Power (Agneya)',
          vastuDesc: 'Fire Element • Cooking, Energy & Vitality',
          color: 'text-orange-400',
          element: 'Fire',
          deity: 'Agni'
        };
  }

  if (norm >= 157.5 && norm < 202.5) {
    return lang === 'hi'
      ? {
          name: 'दक्षिण (South)',
          code: 'S',
          vastuTitle: 'यम स्थान (दक्षिण)',
          vastuDesc: 'स्थिरता, विश्राम, ख्याति व भारी निर्माण',
          color: 'text-red-400',
          element: 'पृथ्वी/अग्नि (Earth/Fire)',
          deity: 'यमराज'
        }
      : {
          name: 'South (दक्षिण)',
          code: 'S',
          vastuTitle: 'Yama Sector (South)',
          vastuDesc: 'Stability, Rest, Fame & Heavy Structural Strength',
          color: 'text-red-400',
          element: 'Earth/Fire',
          deity: 'Yama'
        };
  }

  if (norm >= 202.5 && norm < 247.5) {
    return lang === 'hi'
      ? {
          name: 'नैऋत्य (South-West)',
          code: 'SW',
          vastuTitle: 'मुख्य शयन कक्ष (Nairutya)',
          vastuDesc: 'गृहस्वामी कक्ष • नेतृत्व, स्थायित्व व संबंध',
          color: 'text-yellow-400',
          element: 'पृथ्वी (Earth)',
          deity: 'नैऋति'
        }
      : {
          name: 'South-West (नैऋत्य)',
          code: 'SW',
          vastuTitle: 'Master Bedroom (Nairutya)',
          vastuDesc: 'Head of Family • Grounding, Leadership & Longevity',
          color: 'text-yellow-400',
          element: 'Earth',
          deity: 'Nairuti'
        };
  }

  if (norm >= 247.5 && norm < 292.5) {
    return lang === 'hi'
      ? {
          name: 'पश्चिम (West)',
          code: 'W',
          vastuTitle: 'वरुण स्थान (पश्चिम)',
          vastuDesc: 'अध्ययन कक्ष, लाभ, बचत व भोजन कक्ष',
          color: 'text-slate-200',
          element: 'जल/अंतरिक्ष (Water/Space)',
          deity: 'वरुण देव'
        }
      : {
          name: 'West (पश्चिम)',
          code: 'W',
          vastuTitle: 'Varuna Sector (West)',
          vastuDesc: 'Study Room, Profits, Dining & Financial Gains',
          color: 'text-slate-200',
          element: 'Water/Space',
          deity: 'Varuna'
        };
  }

  return lang === 'hi'
    ? {
        name: 'वायव्य (North-West)',
        code: 'NW',
        vastuTitle: 'अतिथि कक्ष (Vayavya)',
        vastuDesc: 'वायु तत्व • भंडार, अतिथि, संचार व संबंध',
        color: 'text-sky-400',
        element: 'वायु (Air)',
        deity: 'वायु देव'
      }
    : {
        name: 'North-West (वायव्य)',
        code: 'NW',
        vastuTitle: 'Guest Room & Flow (Vayavya)',
        vastuDesc: 'Air Element • Communication, Guests & Movement',
        color: 'text-sky-400',
        element: 'Air',
        deity: 'Vayu'
      };
};

export const getWeatherDescription = (code: number | undefined | null, lang: 'hi' | 'en'): string => {
  if (code === undefined || code === null) {
    return lang === 'hi' ? 'साफ़ आसमान' : 'Clear Sky';
  }
  if (code === 0) return lang === 'hi' ? 'साफ़ आसमान' : 'Clear Sky';
  if (code >= 1 && code <= 3) return lang === 'hi' ? 'हल्के बादल' : 'Partly Cloudy';
  if (code === 45 || code === 48) return lang === 'hi' ? 'कोहरा' : 'Foggy';
  if (code >= 51 && code <= 65) return lang === 'hi' ? 'वर्षा' : 'Rain';
  if (code >= 80 && code <= 82) return lang === 'hi' ? 'बौछारें' : 'Showers';
  if (code >= 95) return lang === 'hi' ? 'गरज के साथ वर्षा' : 'Thunderstorm';
  return lang === 'hi' ? 'सुहावना मौसम' : 'Pleasant Weather';
};
