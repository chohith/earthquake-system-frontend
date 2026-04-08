import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  "en": {
    "translation": {
      "nav": {
        "liveMonitoring": "Live Monitoring",
        "analyticsDashboard": "Analytics Dashboard",
        "emergencyPreparedness": "Emergency & Preparedness",
        "dataLabHistory": "Data Lab & History",
        "selectCountry": "Select Country"
      },
      "chatbot": {
        "title": "SeismoAI Assistant",
        "placeholder": "Type your earthquake-related question...",
        "ariaSend": "Send message",
        "greet": "Hello! I am the SeismoAI Assistant. How can I help you today?"
      },
      "globe": {
        "title": "Interactive Earthquake Globe",
        "lastHour": "Last Hour",
        "lastDay": "Last Day",
        "lastWeek": "Last Week",
        "lastMonth": "Last Month",
        "desc": "Drag to rotate - Scroll to zoom - Click markers for details - Live data from USGS & ",
        "riseq": "RISEQ (https://riseq.seismo.gov.in/riseq/earthquake)"
      },
      "recent": {
        "title": "Recent Activity - Last 24 Hours",
        "total": "Total earthquakes recorded",
        "latest": "Latest 20",
        "all": "All 24 Hours",
        "location": "Location",
        "magnitude": "Magnitude",
        "severity": "Severity",
        "datetime": "Date & Time",
        "depth": "Depth (km)",
        "coordinates": "Coordinates",
        "sourcePrefix": "Data sources: USGS Earthquake Hazards Program & RISEQ (Regional Seismic Network of India)",
        "riseq": "",
        "lastUpdated": "Last updated"
      },
      "hero": {
        "liveBadge": "Live Monitoring Active",
        "title1": "AI-Driven Seismic Analysis",
        "title2": "& Real-Time Response",
        "desc": "Advanced spatiotemporal analysis of global seismic activity. Monitor earthquakes in real-time, understand risk levels, and stay prepared with AI-powered insights.",
        "btnLive": "View Live Map →",
        "btnLearn": "Learn More",
        "stat1": "24/7",
        "stat1Desc": "Global Coverage",
        "stat2": "<2 min",
        "stat2Desc": "Avg. Detection",
        "stat3": "~15-16",
        "stat3Desc": "M7+ Annually",
        "stat4": "2,000+",
        "stat4Desc": "Active Stations"
      },
      "dashboard": {
        "legendTitle": "Magnitude Severity Legend",
        "minor": "Minor",
        "light": "Light",
        "moderate": "Moderate",
        "strong": "Strong+"
      }
    }
  },
  "hi": {
    "translation": {
      "nav": {
        "liveMonitoring": "लाइव मॉनिटरिंग",
        "analyticsDashboard": "एनालिटिक्स डैशबोर्ड",
        "emergencyPreparedness": "आपातकालीन तैयारी",
        "dataLabHistory": "डेटा लैब और इतिहास",
        "selectCountry": "देश चुनें"
      },
      "chatbot": {
        "title": "सिसमो एआई सहायक",
        "placeholder": "अपना प्रश्न टाइप करें...",
        "ariaSend": "संदेश भेजें",
        "greet": "नमस्ते! मैं सिसमो एआई सहायक हूँ।"
      },
      "globe": {
        "title": "इंटरएक्टिव भूकंप ग्लोब",
        "lastHour": "पिछला घंटा",
        "lastDay": "पिछला दिन",
        "lastWeek": "सप्ताह",
        "lastMonth": "महीना",
        "desc": "घुमाने के लिए खींचें",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "हाल की गतिविधि",
        "total": "कुल भूकंप",
        "latest": "नवीनतम 20",
        "all": "सभी",
        "location": "स्थान",
        "magnitude": "तीव्रता",
        "severity": "गंभीरता",
        "datetime": "दिनांक",
        "depth": "गहराई (किमी)",
        "coordinates": "निर्देशांक",
        "sourcePrefix": "डेटा स्रोत: USGS",
        "riseq": "",
        "lastUpdated": "अंतिम अद्यतन"
      },
      "hero": {
        "liveBadge": "लाइव मॉनिटरिंग",
        "title1": "भूकंपीय विश्लेषण",
        "title2": "और रिस्पांस",
        "desc": "भूकंप की निगरानी करें",
        "btnLive": "मैप देखें",
        "btnLearn": "अधिक",
        "stat1": "24/7",
        "stat1Desc": "वैश्विक",
        "stat2": "<2 मिनट",
        "stat2Desc": "पहचान",
        "stat3": "~15",
        "stat3Desc": "M7+",
        "stat4": "2000",
        "stat4Desc": "स्टेशन"
      },
      "dashboard": {
        "legendTitle": "लीजेंड",
        "minor": "मामूली",
        "light": "हल्का",
        "moderate": "मध्यम",
        "strong": "मजबूत+"
      }
    }
  },
  "ta": {
    "translation": {
      "nav": {
        "liveMonitoring": "நேரடி கண்காணிப்பு",
        "analyticsDashboard": "டாஷ்போர்டு",
        "emergencyPreparedness": "முன்னேற்பாடுகள்",
        "dataLabHistory": "ஆய்வகம்",
        "selectCountry": "நாடு"
      },
      "chatbot": {
        "title": "சிஸ்மோ ஏஐ",
        "placeholder": "தட்டச்சு செய்யவும்...",
        "ariaSend": "அனுப்பு",
        "greet": "வணக்கம்!"
      },
      "globe": {
        "title": "குளோப்",
        "lastHour": "மணிநேரம்",
        "lastDay": "கடந்த நாள்",
        "lastWeek": "வாரம்",
        "lastMonth": "மாதம்",
        "desc": "பெரிதாக்க",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "சமீபத்திய",
        "total": "மொத்த",
        "latest": "20",
        "all": "அனைத்து",
        "location": "இடம்",
        "magnitude": "அளவு",
        "severity": "தீவிரம்",
        "datetime": "நேரம்",
        "depth": "ஆழம்",
        "coordinates": "ஆயத்தொலைவுகள்",
        "sourcePrefix": "ஆதாரங்கள்",
        "riseq": "",
        "lastUpdated": "புதுப்பிக்கப்பட்டது"
      },
      "hero": {
        "liveBadge": "நேரடி",
        "title1": "பகுப்பாய்வு",
        "title2": "பதில்",
        "desc": "உண்மையான நேரத்தில்",
        "btnLive": "வரைபடம்",
        "btnLearn": "அறியவும்",
        "stat1": "24/7",
        "stat1Desc": "உலகளாவிய",
        "stat2": "<2",
        "stat2Desc": "சராசரி",
        "stat3": "~15",
        "stat3Desc": "M7+",
        "stat4": "2000",
        "stat4Desc": "நிலையங்கள்"
      },
      "dashboard": {
        "legendTitle": "அளவு",
        "minor": "சிறிய",
        "light": "அற்பமான",
        "moderate": "மிதமான",
        "strong": "வலுவான+"
      }
    }
  },
  "es": {
    "translation": {
      "nav": {
        "liveMonitoring": "Monitoreo en vivo",
        "analyticsDashboard": "Panel analítico",
        "emergencyPreparedness": "Preparación de emergencia",
        "dataLabHistory": "Laboratorio y Datos",
        "selectCountry": "Elige país"
      },
      "chatbot": {
        "title": "Asistente SeismoAI",
        "placeholder": "Escriba aquí...",
        "ariaSend": "Enviar",
        "greet": "¡Hola! Soy tu asistente."
      },
      "globe": {
        "title": "Globo Interactivo",
        "lastHour": "Última Hora",
        "lastDay": "Último Día",
        "lastWeek": "Semana",
        "lastMonth": "Mes",
        "desc": "Arrastra para rotar",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "Actividad Reciente",
        "total": "Total de sismos",
        "latest": "Últimos 20",
        "all": "Todos",
        "location": "Ubicación",
        "magnitude": "Magnitud",
        "severity": "Gravedad",
        "datetime": "Fecha y hora",
        "depth": "Profundidad",
        "coordinates": "Coordenadas",
        "sourcePrefix": "Fuentes: USGS",
        "riseq": "",
        "lastUpdated": "Haber actualizado"
      },
      "hero": {
        "liveBadge": "Monitoreo en vivo",
        "title1": "Análisis Sísmico IA",
        "title2": "y Respuesta",
        "desc": "Análisis espacio-temporal...",
        "btnLive": "Ver Mapa",
        "btnLearn": "Saber Más",
        "stat1": "24/7",
        "stat1Desc": "Cobertura",
        "stat2": "<2 min",
        "stat2Desc": "Detección",
        "stat3": "~15-16",
        "stat3Desc": "M7+ Anual",
        "stat4": "2,000+",
        "stat4Desc": "Estaciones"
      },
      "dashboard": {
        "legendTitle": "Métrica",
        "minor": "Menor",
        "light": "Ligero",
        "moderate": "Moderado",
        "strong": "Fuerte+"
      }
    }
  },
  "fr": {
    "translation": {
      "nav": {
        "liveMonitoring": "Surveillance en direct",
        "analyticsDashboard": "Tableau de Bord",
        "emergencyPreparedness": "Préparation aux urgences",
        "dataLabHistory": "Laboratoire de Données",
        "selectCountry": "Choisis un pays"
      },
      "chatbot": {
        "title": "Assistant SeismoAI",
        "placeholder": "Tapez ici...",
        "ariaSend": "Envoyer",
        "greet": "Bonjour! Je suis l'assistant SeismoAI."
      },
      "globe": {
        "title": "Globe Interactif",
        "lastHour": "Dernière Heure",
        "lastDay": "Dernier Jour",
        "lastWeek": "Semaine",
        "lastMonth": "Mois",
        "desc": "Faites glisser pour tourner",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "Activité Récente",
        "total": "Total de séismes",
        "latest": "Dernières 20",
        "all": "Tous",
        "location": "Emplacement",
        "magnitude": "Magnitude",
        "severity": "Gravité",
        "datetime": "Heure et date",
        "depth": "Profondeur",
        "coordinates": "Coordonnées",
        "sourcePrefix": "Sources: USGS",
        "riseq": "",
        "lastUpdated": "Mis à jour"
      },
      "hero": {
        "liveBadge": "En direct",
        "title1": "Analyse Sismique IA",
        "title2": "et Réponse",
        "desc": "Analyse avancée...",
        "btnLive": "Voir la Carte",
        "btnLearn": "En savoir plus",
        "stat1": "24/7",
        "stat1Desc": "Mondial",
        "stat2": "<2 min",
        "stat2Desc": "Détection",
        "stat3": "~15-16",
        "stat3Desc": "M7+ Annuel",
        "stat4": "2,000+",
        "stat4Desc": "Stations"
      },
      "dashboard": {
        "legendTitle": "Métriques",
        "minor": "Mineur",
        "light": "Léger",
        "moderate": "Modéré",
        "strong": "Fort+"
      }
    }
  },
  "ar": {
    "translation": {
      "nav": {
        "liveMonitoring": "المراقبة الحية",
        "analyticsDashboard": "لوحة التحليلات",
        "emergencyPreparedness": "الاستعداد للطوارئ",
        "dataLabHistory": "مختبر البيانات والتاريخ",
        "selectCountry": "اختر الدولة"
      },
      "chatbot": {
        "title": "مساعد الذكاء الاصطناعي",
        "placeholder": "اكتب هنا...",
        "ariaSend": "إرسال",
        "greet": "مرحباً! أنا المساعد."
      },
      "globe": {
        "title": "نموذج الكرة الأرضية",
        "lastHour": "الساعة الماضية",
        "lastDay": "اليوم الماضي",
        "lastWeek": "الأسبوع",
        "lastMonth": "الشهر",
        "desc": "اسحب للتدوير",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "النشاط الأخير",
        "total": "إجمالي الزلازل",
        "latest": "أحدث 20",
        "all": "الكل",
        "location": "الموقع",
        "magnitude": "القوة",
        "severity": "الخطورة",
        "datetime": "التاريخ",
        "depth": "العمق",
        "coordinates": "الإحداثيات",
        "sourcePrefix": "USGS والمصادر",
        "riseq": "",
        "lastUpdated": "تم التحديث"
      },
      "hero": {
        "liveBadge": "المراقبة الحية",
        "title1": "تحليل زلزالي مدعوم بالذكاء الاصطناعي",
        "title2": "استجابة مباشرة",
        "desc": "تحليل متقدم...",
        "btnLive": "عرض الخريطة",
        "btnLearn": "اقرأ المزيد",
        "stat1": "24/7",
        "stat1Desc": "تغطية",
        "stat2": "<2 دقيقة",
        "stat2Desc": "الكشف",
        "stat3": "~15",
        "stat3Desc": "M7+ سنويًا",
        "stat4": "2000+",
        "stat4Desc": "محطات"
      },
      "dashboard": {
        "legendTitle": "مقياس الخطورة",
        "minor": "طفيف",
        "light": "خفيف",
        "moderate": "متوسط",
        "strong": "قوي+"
      }
    }
  },
  "ru": {
    "translation": {
      "nav": {
        "liveMonitoring": "Прямой мониторинг",
        "analyticsDashboard": "Панель аналитики",
        "emergencyPreparedness": "Аварийная готовность",
        "dataLabHistory": "Лаборатория данных",
        "selectCountry": "Выберите страну"
      },
      "chatbot": {
        "title": "СейсмоAI ассистент",
        "placeholder": "Введите текст...",
        "ariaSend": "Отправить",
        "greet": "Привет! Я СейсмоAI ассистент."
      },
      "globe": {
        "title": "Интерактивный глобус",
        "lastHour": "Последний час",
        "lastDay": "Последний день",
        "lastWeek": "Неделя",
        "lastMonth": "Месяц",
        "desc": "Перетащите для вращения",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "Недавняя активность",
        "total": "Всего землетрясений",
        "latest": "Последние 20",
        "all": "Все",
        "location": "Локация",
        "magnitude": "Магнитуда",
        "severity": "Тяжесть",
        "datetime": "Дата и время",
        "depth": "Глубина",
        "coordinates": "Координаты",
        "sourcePrefix": "USGS",
        "riseq": "",
        "lastUpdated": "Обновлено"
      },
      "hero": {
        "liveBadge": "Прямой эфир",
        "title1": "Сейсмический Анализ ИИ",
        "title2": "и Ответы",
        "desc": "Продвинутый анализ...",
        "btnLive": "Карта",
        "btnLearn": "Подробнее",
        "stat1": "24/7",
        "stat1Desc": "Покрытие",
        "stat2": "<2 мин",
        "stat2Desc": "Обнаружение",
        "stat3": "~15",
        "stat3Desc": "M7+ В год",
        "stat4": "2000+",
        "stat4Desc": "Станций"
      },
      "dashboard": {
        "legendTitle": "Легенда",
        "minor": "Минор",
        "light": "Лёгкий",
        "moderate": "Умеренный",
        "strong": "Сильный+"
      }
    }
  },
  "pt": {
    "translation": {
      "nav": {
        "liveMonitoring": "Monitoramento ao Vivo",
        "analyticsDashboard": "Painel de Análise",
        "emergencyPreparedness": "Preparação para Emergências",
        "dataLabHistory": "Laboratório de Dados",
        "selectCountry": "Selecione o país"
      },
      "chatbot": {
        "title": "Assistente SeismoAI",
        "placeholder": "Digite sua pergunta...",
        "ariaSend": "Enviar",
        "greet": "Olá! Como posso ajudar?"
      },
      "globe": {
        "title": "Globo Interativo",
        "lastHour": "Última Hora",
        "lastDay": "Último Dia",
        "lastWeek": "Última Semana",
        "lastMonth": "Último Mês",
        "desc": "Arraste para girar",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "Atividade Recente",
        "total": "Total de terremotos",
        "latest": "Últimos 20",
        "all": "Todos",
        "location": "Localização",
        "magnitude": "Magnitude",
        "severity": "Gravidade",
        "datetime": "Data e Hora",
        "depth": "Profundidade",
        "coordinates": "Coordenadas",
        "sourcePrefix": "USGS",
        "riseq": "",
        "lastUpdated": "Atualizado"
      },
      "hero": {
        "liveBadge": "Monitoramento ao Vivo",
        "title1": "Análise Sísmica com IA",
        "title2": "& Resposta",
        "desc": "Análise avançada.",
        "btnLive": "Ver Mapa",
        "btnLearn": "Saiba Mais",
        "stat1": "24/7",
        "stat1Desc": "Global",
        "stat2": "<2 min",
        "stat2Desc": "Detecção",
        "stat3": "~15",
        "stat3Desc": "M7+ Anual",
        "stat4": "2000+",
        "stat4Desc": "Estações"
      },
      "dashboard": {
        "legendTitle": "Legenda",
        "minor": "Menor",
        "light": "Leve",
        "moderate": "Moderado",
        "strong": "Forte+"
      }
    }
  },
  "id": {
    "translation": {
      "nav": {
        "liveMonitoring": "Pemantauan Langsung",
        "analyticsDashboard": "Dasbor Analitik",
        "emergencyPreparedness": "Kesiapsiagaan Darurat",
        "dataLabHistory": "Laboratorium Data",
        "selectCountry": "Pilih Negara"
      },
      "chatbot": {
        "title": "Asisten SeismoAI",
        "placeholder": "Ketik di sini...",
        "ariaSend": "Kirim",
        "greet": "Halo! Saya Asisten Anda."
      },
      "globe": {
        "title": "Globe Gempa Bumi",
        "lastHour": "Satu Jam Terakhir",
        "lastDay": "Hari Terakhir",
        "lastWeek": "Minggu Terakhir",
        "lastMonth": "Bulan Terakhir",
        "desc": "Geser untuk memutar",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "Aktivitas Terbaru",
        "total": "Total gempa",
        "latest": "20 Terbaru",
        "all": "Semua",
        "location": "Lokasi",
        "magnitude": "Magnitudo",
        "severity": "Tingkat Keparahan",
        "datetime": "Tanggal",
        "depth": "Kedalaman",
        "coordinates": "Koordinat",
        "sourcePrefix": "Sumber data: USGS",
        "riseq": "",
        "lastUpdated": "Diperbarui"
      },
      "hero": {
        "liveBadge": "Live",
        "title1": "Analisis Gempa AI",
        "title2": "& Respons Langsung",
        "desc": "Analisis spasial...",
        "btnLive": "Lihat Peta",
        "btnLearn": "Lebih Lanjut",
        "stat1": "24/7",
        "stat1Desc": "Global",
        "stat2": "<2 mnt",
        "stat2Desc": "Deteksi",
        "stat3": "~15",
        "stat3Desc": "M7+ Tahunan",
        "stat4": "2000+",
        "stat4Desc": "Stasiun"
      },
      "dashboard": {
        "legendTitle": "Skala",
        "minor": "Kecil",
        "light": "Ringan",
        "moderate": "Sedang",
        "strong": "Kuat+"
      }
    }
  },
  "sa": {
    "translation": {
      "nav": {
        "liveMonitoring": "प्रत्यक्षदर्शनम्",
        "analyticsDashboard": "विश्लेषणम्",
        "emergencyPreparedness": "आपातकालीनसज्जता",
        "dataLabHistory": "दत्तांशप्रयोगशाला",
        "selectCountry": "देशं चिनोतु"
      },
      "chatbot": {
        "title": "अन्वेषण सहायकः",
        "placeholder": "लिखतु...",
        "ariaSend": "प्रेषय",
        "greet": "नमस्कारः! भवतः कथं साहाय्यं करवाणि?"
      },
      "globe": {
        "title": "भूकम्पनभूमण्डलम्",
        "lastHour": "गतहोरा",
        "lastDay": "गतदिनम्",
        "lastWeek": "सप्ताहः",
        "lastMonth": "मासः",
        "desc": "भ्रामयन्तु",
        "riseq": "RISEQ"
      },
      "recent": {
        "title": "नूतनगतिविधयः",
        "total": "आहत्य",
        "latest": "नूतनाः",
        "all": "सर्वे",
        "location": "स्थानम्",
        "magnitude": "तीव्रता",
        "severity": "गम्भीरता",
        "datetime": "समयः",
        "depth": "गभीरता",
        "coordinates": "अक्ष-देशान्तर",
        "sourcePrefix": "USGS",
        "riseq": "",
        "lastUpdated": "अन्तिमः अद्यतनः"
      },
      "hero": {
        "liveBadge": "प्रत्यक्षदर्शनम्",
        "title1": "स्वचालितभूकम्पविश्लेषणम्",
        "title2": "तथा त्वरितप्रतिक्रिया",
        "desc": "उन्नतविश्लेषणम्।",
        "btnLive": "पश्यन्तु",
        "btnLearn": "अधिकम्",
        "stat1": "24/7",
        "stat1Desc": "विश्वस्तरः",
        "stat2": "<2",
        "stat2Desc": "ज्ञानम्",
        "stat3": "~15",
        "stat3Desc": "M7+",
        "stat4": "2000+",
        "stat4Desc": "केन्द्राणि"
      },
      "dashboard": {
        "legendTitle": "तीव्रता",
        "minor": "अल्प",
        "light": "मृदु",
        "moderate": "मध्यम",
        "strong": "तीव्र+"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
